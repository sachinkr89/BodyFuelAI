import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ClipboardCheck, Plus, Check } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { sendChatPrompt } from '../services/geminiService';
import { supabase } from '../services/supabase';
import { recalculateDailySummary } from '../stores/foodLogStore';
import type { MealType } from '../types';
import './ChatPage.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LogMealData {
  items: Array<{
    name: string;
    quantity: string;
    unit: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
  }>;
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
  };
}

export default function ChatPage() {
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('bodyfuel_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: `Namaste! 🙏 I am your **BodyFuel AI Health Coach**.\n\nAsk me anything about nutrition, recipes, workouts, or health. You can also tell me what you ate (e.g. *"I just ate a paratha and half a cup of curd"*), and I'll calculate the macros and let you log it to your daily diet instantly!`,
      },
    ];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('bodyfuel_chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send chat history (up to last 10 messages to save context space)
      const chatContext = [...messages, userMessage].slice(-10);
      const aiResponseText = await sendChatPrompt(chatContext);
      
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponseText }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue connecting to the OpenRouter servers. Please try again shortly.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      localStorage.removeItem('bodyfuel_chat_history');
      setMessages([
        {
          role: 'assistant',
          content: `Namaste! 🙏 I am your **BodyFuel AI Health Coach**.\n\nAsk me anything about nutrition, recipes, workouts, or health. You can also tell me what you ate (e.g. *"I just ate a paratha and half a cup of curd"*), and I'll calculate the macros and let you log it to your daily diet instantly!`,
        },
      ]);
    }
  };

  // Helper to parse formatting (bold, headers, rules, lists, labels, tables, blockquotes)
  const formatMessageContent = (content: string) => {
    // Strip the <LOG_MEAL> block from text content
    const cleanContent = content.replace(/<LOG_MEAL>[\s\S]*?<\/LOG_MEAL>/g, '').trim();
    const lines = cleanContent.split('\n');
    const elements: React.ReactNode[] = [];
    
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let listType: 'ul' | 'ol' | null = null;
    let listStartNumber = 1;

    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = (key: string | number) => {
      if (!inList) return;
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${key}`} className="chat-ul">
            {listItems}
          </ul>
        );
      } else if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${key}`} start={listStartNumber} className="chat-ol">
            {listItems}
          </ol>
        );
      }
      listItems = [];
      inList = false;
      listType = null;
    };

    const flushTable = (key: string | number) => {
      if (!inTable) return;
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const dataRows = tableRows.slice(1);
        elements.push(
          <div key={`table-wrapper-${key}`} className="chat-table-wrapper">
            <table className="chat-table">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={`th-${i}`}>{renderTextWithFormatting(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`}>
                    {row.map((cell, cIdx) => (
                      <td key={`td-${cIdx}`}>{renderTextWithFormatting(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    };

    const flushAll = (key: string | number) => {
      flushList(key);
      flushTable(key);
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      // Horizontal rules
      if (trimmed === '---' || trimmed === '***') {
        flushAll(idx);
        elements.push(<hr key={idx} className="chat-hr" />);
        return;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushAll(idx);
        const headerText = trimmed.replace(/^###\s+/, '');
        elements.push(<h3 key={idx} className="chat-h3">{renderTextWithFormatting(headerText)}</h3>);
        return;
      }
      if (trimmed.startsWith('## ')) {
        flushAll(idx);
        const headerText = trimmed.replace(/^##\s+/, '');
        elements.push(<h2 key={idx} className="chat-h2">{renderTextWithFormatting(headerText)}</h2>);
        return;
      }
      if (trimmed.startsWith('# ')) {
        flushAll(idx);
        const headerText = trimmed.replace(/^#\s+/, '');
        elements.push(<h1 key={idx} className="chat-h1">{renderTextWithFormatting(headerText)}</h1>);
        return;
      }

      // Blockquotes and Alerts
      if (trimmed.startsWith('>')) {
        flushAll(idx);
        const quoteText = trimmed.replace(/^>\s*/, '');
        let alertClass = '';
        let cleanText = quoteText;
        if (quoteText.startsWith('[!NOTE]')) {
          alertClass = 'note';
          cleanText = quoteText.replace(/^\[!NOTE\]\s*/, '');
        } else if (quoteText.startsWith('[!TIP]')) {
          alertClass = 'tip';
          cleanText = quoteText.replace(/^\[!TIP\]\s*/, '');
        } else if (quoteText.startsWith('[!IMPORTANT]')) {
          alertClass = 'important';
          cleanText = quoteText.replace(/^\[!IMPORTANT\]\s*/, '');
        } else if (quoteText.startsWith('[!WARNING]')) {
          alertClass = 'warning';
          cleanText = quoteText.replace(/^\[!WARNING\]\s*/, '');
        }
        elements.push(
          <blockquote key={idx} className={`chat-blockquote ${alertClass}`}>
            {renderTextWithFormatting(cleanText)}
          </blockquote>
        );
        return;
      }

      // Table rows
      if (trimmed.startsWith('|')) {
        flushList(idx);
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Check if it's a separator line like |---|---|
        const isSeparator = /^\|[\s\-:|]+\|$/.test(trimmed);
        if (!isSeparator) {
          // Split by pipe and filter outer empty tokens
          const cells = line.split('|').map(c => c.trim()).filter((c, index, arr) => {
            if (index === 0 && c === '') return false;
            if (index === arr.length - 1 && c === '') return false;
            return true;
          });
          tableRows.push(cells);
        }
        return;
      }

      // Bullet lists
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        flushTable(idx);
        if (!inList || listType !== 'ul') {
          flushList(idx);
          inList = true;
          listType = 'ul';
        }
        const itemText = trimmed.replace(/^[*+-]\s+/, '');
        listItems.push(<li key={`li-${idx}`}>{renderTextWithFormatting(itemText)}</li>);
        return;
      }

      // Numbered lists
      const numMatch = trimmed.match(/^(\d+)\.\s+/);
      if (numMatch) {
        flushTable(idx);
        const num = parseInt(numMatch[1]);
        if (!inList || listType !== 'ol') {
          flushList(idx);
          inList = true;
          listType = 'ol';
          listStartNumber = num;
        }
        const itemText = trimmed.replace(/^\d+\.\s+/, '');
        listItems.push(<li key={`li-${idx}`}>{renderTextWithFormatting(itemText)}</li>);
        return;
      }

      // Empty line
      if (!trimmed) {
        flushAll(idx);
        elements.push(<div key={idx} style={{ height: '8px' }} />);
        return;
      }

      // Normal paragraph line
      flushAll(idx);
      elements.push(<p key={idx} className="chat-p">{renderTextWithFormatting(trimmed)}</p>);
    });

    flushAll('final');
    return elements;
  };

  const renderTextWithFormatting = (text: string) => {
    // 1. First parse bolding: **text**
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    const formattedParts = boldParts.map((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong>{part.slice(2, -2)}</strong>;
      }
      
      // 2. Automatically bold terms before a colon (e.g. "Paneer & Tofu: ...", "Eggs: ...", "Breakfast: ...")
      // Only do this if there is a colon and the text before the colon is relatively short (<30 chars) and doesn't contain links/tags
      const colonIndex = part.indexOf(':');
      if (colonIndex > 0 && colonIndex < 35 && !part.slice(0, colonIndex).includes('http')) {
        const label = part.slice(0, colonIndex + 1);
        const rest = part.slice(colonIndex + 1);
        return (
          <>
            <strong className="chat-label">{label}</strong>
            {rest}
          </>
        );
      }
      
      return part;
    });

    // Return the mapped elements
    return formattedParts.map((el, index) => <span key={index}>{el}</span>);
  };

  // Extract <LOG_MEAL> JSON data if present
  const extractLogMealData = (content: string): LogMealData | null => {
    const match = content.match(/<LOG_MEAL>([\s\S]*?)<\/LOG_MEAL>/);
    if (!match) return null;
    try {
      return JSON.parse(match[1].trim()) as LogMealData;
    } catch (e) {
      console.error('Failed to parse LOG_MEAL block:', e);
      return null;
    }
  };

  const displayName = profile?.display_name?.split(' ')[0] || 'User';

  return (
    <div className="chat-container animate-fade-in">
      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const logData = msg.role === 'assistant' ? extractLogMealData(msg.content) : null;
          
          return (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className="chat-avatar">
                {msg.role === 'assistant' ? 'AI' : displayName[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 'calc(100% - 48px)' }}>
                <div className="chat-bubble">
                  {formatMessageContent(msg.content)}
                </div>
                {logData && profile?.id && (
                  <QuickLogCard data={logData} userId={profile.id} />
                )}
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-avatar">AI</div>
            <div className="chat-bubble">
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <button 
          onClick={clearHistory} 
          className="tool-btn" 
          type="button" 
          title="Clear Conversation"
          style={{ fontSize: '0.8rem', padding: '0 10px', height: '40px', width: 'auto' }}
        >
          Clear
        </button>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask about recipes, calories, workouts, or describe your diet..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          type="button"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function QuickLogCard({ data, userId }: { data: LogMealData; userId: string }) {
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLog = async () => {
    if (logged || loading) return;
    setLoading(true);
    try {
      const rawText = data.items.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
      
      // 1. Insert food log
      const { data: logData, error: logError } = await supabase
        .from('food_logs')
        .insert({
          user_id: userId,
          raw_text: rawText,
          meal_type: mealType,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (logError || !logData) {
        throw logError || new Error('Failed to create food log');
      }

      // 2. Insert parsed macros
      const macroInserts = data.items.map(item => ({
        food_log_id: logData.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fats_g: item.fats_g,
        fiber_g: item.fiber_g || 0,
      }));

      const { error: macroError } = await supabase
        .from('parsed_macros')
        .insert(macroInserts);

      if (macroError) {
        await supabase.from('food_logs').delete().eq('id', logData.id);
        throw macroError;
      }

      // 3. Recalculate daily summary
      await recalculateDailySummary(userId);
      setLogged(true);
    } catch (err) {
      console.error('Failed to log meal from chat:', err);
      alert('Failed to log meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-log-card">
      <div className="chat-log-header">
        <ClipboardCheck size={16} />
        <span>Log this meal to your diet</span>
      </div>
      <div className="chat-log-items">
        {data.items.map((item, idx) => (
          <div key={idx} className="chat-log-item">
            <div>
              <span className="chat-log-item-name">{item.name}</span>
              {item.quantity && <span style={{ color: 'var(--text-secondary)' }}> ({item.quantity} {item.unit})</span>}
            </div>
            <span className="chat-log-item-macros">
              {item.calories} kcal | {item.protein_g}g P
            </span>
          </div>
        ))}
      </div>
      <div className="chat-log-totals">
        <span>Totals:</span>
        <span className="chat-log-totals-macros">
          {data.totals.calories} kcal | {data.totals.protein_g}g P | {data.totals.carbs_g}g C | {data.totals.fats_g}g F
        </span>
      </div>
      <div className="chat-log-actions">
        <select
          className="chat-log-select"
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          disabled={logged || loading}
        >
          <option value="breakfast">🍳 Breakfast</option>
          <option value="lunch">🍲 Lunch</option>
          <option value="dinner">🍽️ Dinner</option>
          <option value="snack">🍎 Snack</option>
        </select>
        <button
          className="chat-log-btn"
          onClick={handleLog}
          disabled={logged || loading}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : logged ? (
            <><Check size={16} /> Logged successfully! ✅</>
          ) : (
            <><Plus size={16} /> Log to Daily Diet</>
          )}
        </button>
      </div>
    </div>
  );
}
