import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useFoodLogStore } from '../stores/foodLogStore';
import FoodInput from '../components/food-log/FoodInput';
import ParsedResultCard from '../components/food-log/ParsedResultCard';
import FoodLogHistory from '../components/food-log/FoodLogHistory';
import type { MealType } from '../types';
import './FoodLogPage.css';

export default function FoodLogPage() {
  const { profile } = useAuthStore();
  const { todaysLogs, isParsing, lastParsedResult, logFood, fetchTodaysLogs, deleteLog, clearLastParsed } = useFoodLogStore();

  useEffect(() => {
    if (profile?.id) fetchTodaysLogs(profile.id);
  }, [profile?.id]);

  const handleSubmit = async (text: string, mealType: MealType, imageBase64?: string) => {
    if (profile?.id) {
      const { error } = await logFood(text, mealType, profile.id, imageBase64);
      if (error) {
        const errorMsg = error.message || String(error);
        alert(`AI Analysis failed:\n\n${errorMsg}\n\nPlease share this error so I can fix it!`);
      }
    }
  };

  const handleConfirm = () => {
    if (profile?.id) {
      fetchTodaysLogs(profile.id);
      clearLastParsed();
    }
  };

  const handleDelete = async (logId: string) => {
    if (profile?.id) {
      await deleteLog(logId, profile.id);
      fetchTodaysLogs(profile.id);
    }
  };

  return (
    <div className="food-log-page animate-fade-in">
      <div className="food-log-section">
        <FoodInput onSubmit={handleSubmit} isLoading={isParsing} />
      </div>

      {lastParsedResult && (
        <div className="food-log-section">
          <ParsedResultCard result={lastParsedResult} onConfirm={handleConfirm} onDiscard={clearLastParsed} />
        </div>
      )}

      <div className="food-log-section">
        <h2 className="food-log-section-title">Today's Meals</h2>
        <FoodLogHistory logs={todaysLogs} onDelete={handleDelete} />
      </div>
    </div>
  );
}
