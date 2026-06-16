import { useState, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, Camera, X } from 'lucide-react';
import { MEAL_TYPES } from '../../utils/constants';
import { getMealTypeFromTime } from '../../utils/helpers';
import { speechService } from '../../services/speechService';
import type { MealType } from '../../types';
import './FoodLog.css';

interface FoodInputProps {
  onSubmit: (text: string, mealType: MealType, imageBase64?: string) => void;
  isLoading?: boolean;
}

export default function FoodInput({ onSubmit, isLoading }: FoodInputProps) {
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState<MealType>(getMealTypeFromTime());
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialTextRef = useRef('');

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
      initialTextRef.current = text; // Save text before recording
      speechService.startListening(
        (result) => {
          setText(initialTextRef.current ? initialTextRef.current + ' ' + result : result);
        },
        (err) => {
          console.error(err);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if ((!text.trim() && !imagePreview) || isLoading) return;
    onSubmit(text.trim(), mealType, imagePreview || undefined);
  };

  return (
    <div className="food-input-container">
      <div className="food-input-header">
        <h3 className="food-input-title">What did you eat?</h3>
        <div className="food-input-tools">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            style={{ display: 'none' }} 
          />
          <button
            className="tool-btn"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            title="Take a photo"
          >
            <Camera size={20} />
          </button>
          <button
            className={`tool-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleVoice}
            type="button"
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
      </div>

      {isRecording && (
        <div className="voice-indicator animate-fade-in">
          <span className="voice-pulse" />
          <span>Listening... speak now</span>
        </div>
      )}

      {imagePreview && (
        <div className="image-preview-container animate-fade-in">
          <img src={imagePreview} alt="Food preview" className="image-preview" />
          <button className="remove-image-btn" onClick={removeImage} type="button">
            <X size={16} />
          </button>
        </div>
      )}

      <textarea
        className="food-textarea"
        placeholder={imagePreview ? "Add any extra details (e.g., 'cooked in butter')..." : "Describe your meal... (e.g., 2 ande aur 1 roti with butter)"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
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
          disabled={(!text.trim() && !imagePreview) || isLoading}
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
