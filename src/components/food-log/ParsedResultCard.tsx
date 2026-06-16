import { Check, X, AlertTriangle } from 'lucide-react';
import type { GeminiParsedResponse } from '../../types';
import { MACRO_COLORS } from '../../utils/constants';
import './FoodLog.css';

interface ParsedResultCardProps {
  result: GeminiParsedResponse;
  onConfirm: () => void;
  onDiscard: () => void;
}

export default function ParsedResultCard({ result, onConfirm, onDiscard }: ParsedResultCardProps) {
  const confidenceColor = result.confidence > 0.8 ? '#10b981' : result.confidence > 0.6 ? '#f59e0b' : '#ef4444';
  const confidenceLabel = result.confidence > 0.8 ? 'High' : result.confidence > 0.6 ? 'Medium' : 'Low';

  return (
    <div className="parsed-card animate-fade-in-up">
      <div className="parsed-header">
        <h3 className="parsed-title">AI Analysis Result</h3>
        <span className="confidence-badge" style={{ background: `${confidenceColor}20`, color: confidenceColor, borderColor: `${confidenceColor}40` }}>
          {Math.round(result.confidence * 100)}% {confidenceLabel}
        </span>
      </div>

      {/* Individual items */}
      <div className="parsed-items">
        {result.items.map((item, i) => (
          <div key={i} className="parsed-item">
            <div className="parsed-item-name">
              <span>{item.name}</span>
              <span className="parsed-item-qty">{item.quantity} {item.unit}</span>
            </div>
            <div className="parsed-item-macros">
              <span style={{ color: MACRO_COLORS.calories }}>{item.calories} kcal</span>
              <span style={{ color: MACRO_COLORS.protein }}>{item.protein_g}g P</span>
              <span style={{ color: MACRO_COLORS.carbs }}>{item.carbs_g}g C</span>
              <span style={{ color: MACRO_COLORS.fats }}>{item.fats_g}g F</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="parsed-totals">
        <div className="parsed-total-item">
          <span className="parsed-total-label">Calories</span>
          <span className="parsed-total-value" style={{ color: MACRO_COLORS.calories }}>{result.totals.calories}</span>
        </div>
        <div className="parsed-total-item">
          <span className="parsed-total-label">Protein</span>
          <span className="parsed-total-value" style={{ color: MACRO_COLORS.protein }}>{result.totals.protein_g}g</span>
        </div>
        <div className="parsed-total-item">
          <span className="parsed-total-label">Carbs</span>
          <span className="parsed-total-value" style={{ color: MACRO_COLORS.carbs }}>{result.totals.carbs_g}g</span>
        </div>
        <div className="parsed-total-item">
          <span className="parsed-total-label">Fats</span>
          <span className="parsed-total-value" style={{ color: MACRO_COLORS.fats }}>{result.totals.fats_g}g</span>
        </div>
      </div>

      {/* Assumptions */}
      {result.assumptions.length > 0 && (
        <div className="parsed-assumptions">
          <AlertTriangle size={14} />
          <div>
            {result.assumptions.map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="parsed-actions">
        <button className="btn-ghost" onClick={onDiscard}><X size={18} /> Discard</button>
        <button className="btn-primary" onClick={onConfirm}><Check size={18} /> Confirm & Save</button>
      </div>
    </div>
  );
}
