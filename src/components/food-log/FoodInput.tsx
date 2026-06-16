import { useState } from 'react';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { MEAL_TYPES } from '../../utils/constants';
import { getMealTypeFromTime } from '../../utils/helpers';
import { speechService } from '../../services/speechService';
import type { MealType } from '../../types';
import './FoodLog.css';

interface FoodInputProps {
  onSubmit: (text: string, mealType: MealType) => void;
  isLoading?: boolean;
}

export default function FoodInput({ onSubmit, isLoading }: FoodInputProps) {
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState<MealType>(getMealTypeFromTime());
  const [isRecording, setIsRecording] = useState(false);

  const handleVoice = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
    } else {
      if (!speechService.isSupported()) {
        alert('Voice input is not supported in this browser.');
        return;
      }
      setIsRecording(true);
      speechService.startListening(
        (result) => {
          setText((prev) => (prev ? prev + ' ' + result : result));
          setIsRecording(false);
        },
        () => setIsRecording(false)
      );
    }
  };

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSubmit(text.trim(), mealType);
  };

  return (
    <div className="food-input-container">
      <div className="food-input-header">
        <h3 className="food-input-title">What did you eat?</h3>
        <button
          className={`voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleVoice}
          type="button"
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {isRecording && (
        <div className="voice-indicator animate-fade-in">
          <span className="voice-pulse" />
          <span>Listening... speak now</span>
        </div>
      )}

      <textarea
        className="food-textarea"
        placeholder="Describe your meal... (e.g., 2 ande aur 1 roti with butter)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={isLoading}
      />

      <div className="food-input-actions">
        <select
          className="meal-selector"
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
        >
          {MEAL_TYPES.map((meal) => (
            <option key={meal.value} value={meal.value}>
              {meal.emoji} {meal.label}
            </option>
          ))}
        </select>

        <button
          className="btn-primary analyze-btn"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
        >
          {isLoading ? (
            <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
          ) : (
            <><Sparkles size={18} /> Analyze with AI</>
          )}
        </button>
      </div>
    </div>
  );
}
