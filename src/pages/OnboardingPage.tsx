import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Dumbbell, ChevronRight, ChevronLeft, Loader2, Check, Flame } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { calculateTDEE, calculateDailyTargets } from '../utils/helpers';
import type { OnboardingData } from '../types';
import './OnboardingPage.css';

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    display_name: '',
    gender: undefined,
    activity_level: undefined,
    goal: undefined,
    body_mode: undefined,
  });

  const update = (fields: Partial<OnboardingData>) => setData((p) => ({ ...p, ...fields }));

  const bmi = useMemo(() => {
    if (data.weight_kg && data.height_cm) {
      const h = data.height_cm / 100;
      return (data.weight_kg / (h * h)).toFixed(1);
    }
    return null;
  }, [data.weight_kg, data.height_cm]);

  const tdee = useMemo(() => {
    if (data.weight_kg && data.height_cm && data.age && data.gender && data.activity_level) {
      return Math.round(calculateTDEE(data.weight_kg, data.height_cm, data.age, data.gender, data.activity_level));
    }
    return null;
  }, [data.weight_kg, data.height_cm, data.age, data.gender, data.activity_level]);

  const targets = useMemo(() => {
    if (tdee && data.goal && data.weight_kg) {
      return calculateDailyTargets(tdee, data.goal, data.weight_kg);
    }
    return null;
  }, [tdee, data.goal, data.weight_kg]);

  const canNext = (() => {
    switch (step) {
      case 1: return !!data.display_name && !!data.age && !!data.gender;
      case 2: return !!data.weight_kg && !!data.height_cm;
      case 3: return !!data.activity_level && !!data.goal;
      case 4: return !!data.body_mode;
      default: return false;
    }
  })();

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { error } = await completeOnboarding(data as OnboardingData);
      if (!error) {
        navigate('/dashboard');
      } else {
        const errorMsg = error.message || JSON.stringify(error);
        alert(`Failed to save profile. Error: ${errorMsg}\n\nPlease share this error message so I can fix it!`);
        console.error(error);
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="login-bg-circle circle-1" />
      <div className="login-bg-circle circle-2" />

      <div className="onboarding-card animate-fade-in-up">
        {/* Progress */}
        <div className="onboarding-progress">
          <div className="onboarding-progress-fill" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <p className="onboarding-step-label">Step {step} of {TOTAL_STEPS}</p>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="onboarding-step animate-fade-in-up" key="step1">
            <h2 className="onboarding-title">Let's get to know you</h2>
            <p className="onboarding-subtitle">Tell us a bit about yourself</p>
            <div className="onboarding-form">
              <label className="field-label">Display Name</label>
              <input className="input-field" placeholder="Your name" value={data.display_name || ''} onChange={(e) => update({ display_name: e.target.value })} />
              <label className="field-label">Age</label>
              <input className="input-field" type="number" placeholder="25" min={10} max={120} value={data.age || ''} onChange={(e) => update({ age: Number(e.target.value) })} />
              <label className="field-label">Gender</label>
              <div className="option-grid cols-3">
                {([['male', '👨', 'Male'], ['female', '👩', 'Female'], ['other', '🧑', 'Other']] as const).map(([val, emoji, label]) => (
                  <button key={val} className={`option-card ${data.gender === val ? 'selected' : ''}`} onClick={() => update({ gender: val })} type="button">
                    <span className="option-card-icon">{emoji}</span>
                    <span className="option-card-title">{label}</span>
                    {data.gender === val && <Check size={16} className="option-check" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Body Metrics */}
        {step === 2 && (
          <div className="onboarding-step animate-fade-in-up" key="step2">
            <h2 className="onboarding-title">Body Metrics</h2>
            <p className="onboarding-subtitle">We'll use this to calculate your daily needs</p>
            <div className="onboarding-form">
              <div className="input-row">
                <div>
                  <label className="field-label">Weight (kg)</label>
                  <input className="input-field" type="number" placeholder="70" min={20} max={300} value={data.weight_kg || ''} onChange={(e) => update({ weight_kg: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="field-label">Height (cm)</label>
                  <input className="input-field" type="number" placeholder="175" min={100} max={250} value={data.height_cm || ''} onChange={(e) => update({ height_cm: Number(e.target.value) })} />
                </div>
              </div>
              {bmi && (
                <div className="bmi-display animate-fade-in">
                  <span className="bmi-label">Your BMI</span>
                  <span className="bmi-value">{bmi}</span>
                  <span className="bmi-category">
                    {Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal' : Number(bmi) < 30 ? 'Overweight' : 'Obese'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Activity & Goal */}
        {step === 3 && (
          <div className="onboarding-step animate-fade-in-up" key="step3">
            <h2 className="onboarding-title">Activity & Goal</h2>
            <p className="onboarding-subtitle">How active are you and what's your fitness goal?</p>
            <div className="onboarding-form">
              <label className="field-label">Activity Level</label>
              <div className="option-grid cols-1">
                {([
                  ['sedentary', '🪑', 'Sedentary', 'Desk job, minimal exercise'],
                  ['light', '🚶', 'Light', 'Light exercise 1-3 days/week'],
                  ['moderate', '🏃', 'Moderate', 'Exercise 3-5 days/week'],
                  ['active', '💪', 'Active', 'Hard exercise 6-7 days/week'],
                  ['very_active', '🔥', 'Very Active', 'Intense exercise, physical job'],
                ] as const).map(([val, emoji, label, desc]) => (
                  <button key={val} className={`option-card horizontal ${data.activity_level === val ? 'selected' : ''}`} onClick={() => update({ activity_level: val })} type="button">
                    <span className="option-card-icon">{emoji}</span>
                    <div className="option-card-text">
                      <span className="option-card-title">{label}</span>
                      <span className="option-card-desc">{desc}</span>
                    </div>
                    {data.activity_level === val && <Check size={16} className="option-check" />}
                  </button>
                ))}
              </div>

              <label className="field-label" style={{ marginTop: 24 }}>Fitness Goal</label>
              <div className="option-grid cols-3">
                {([
                  ['lose', '📉', 'Lose'],
                  ['maintain', '⚖️', 'Maintain'],
                  ['gain', '📈', 'Gain'],
                  ['bulk', '💪', 'Bulk'],
                  ['cut', '✂️', 'Cut'],
                ] as const).map(([val, emoji, label]) => (
                  <button key={val} className={`option-card ${data.goal === val ? 'selected' : ''}`} onClick={() => update({ goal: val })} type="button">
                    <span className="option-card-icon">{emoji}</span>
                    <span className="option-card-title">{label}</span>
                    {data.goal === val && <Check size={16} className="option-check" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Choose Mode */}
        {step === 4 && (
          <div className="onboarding-step animate-fade-in-up" key="step4">
            <h2 className="onboarding-title">Choose Your Mode</h2>
            <p className="onboarding-subtitle">Pick the dashboard experience that suits you</p>
            <div className="onboarding-form">
              <div className="mode-grid">
                <button className={`mode-card general ${data.body_mode === 'general' ? 'selected' : ''}`} onClick={() => update({ body_mode: 'general' })} type="button">
                  <div className="mode-card-header">
                    <Heart size={28} />
                    <span className="mode-card-name">Wellness</span>
                    {data.body_mode === 'general' && <Check size={18} className="option-check" />}
                  </div>
                  <p className="mode-card-desc">Track energy, hydration & overall wellness</p>
                  <ul className="mode-card-features">
                    <li>✦ Daily Energy Score</li>
                    <li>✦ Hydration Tracker</li>
                    <li>✦ Simple Nutrition Alerts</li>
                    <li>✦ Clean, Minimal Dashboard</li>
                  </ul>
                </button>

                <button className={`mode-card gym ${data.body_mode === 'gym' ? 'selected' : ''}`} onClick={() => update({ body_mode: 'gym' })} type="button">
                  <div className="mode-card-header">
                    <Dumbbell size={28} />
                    <span className="mode-card-name">Athlete</span>
                    {data.body_mode === 'gym' && <Check size={18} className="option-check" />}
                  </div>
                  <p className="mode-card-desc">Track macros, protein timing & supplements</p>
                  <ul className="mode-card-features">
                    <li>✦ Macro Distribution Charts</li>
                    <li>✦ Protein Timing Analysis</li>
                    <li>✦ Bulk/Cut Deficit Tracker</li>
                    <li>✦ Supplement Reminders</li>
                  </ul>
                </button>
              </div>

              {tdee && targets && (
                <div className="tdee-result animate-fade-in">
                  <Flame size={20} style={{ color: '#f97316' }} />
                  <div className="tdee-info">
                    <div className="tdee-row">
                      <span className="tdee-label">Your TDEE</span>
                      <span className="tdee-value">{tdee} kcal/day</span>
                    </div>
                    <div className="tdee-row">
                      <span className="tdee-label">Daily Calorie Target</span>
                      <span className="tdee-value">{targets.calories} kcal</span>
                    </div>
                    <div className="tdee-row">
                      <span className="tdee-label">Protein Target</span>
                      <span className="tdee-value">{targets.protein_g}g</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="onboarding-actions">
          {step > 1 ? (
            <button className="btn-secondary" onClick={() => setStep(step - 1)} type="button">
              <ChevronLeft size={18} /> Back
            </button>
          ) : <div />}

          {step < TOTAL_STEPS ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext} type="button">
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleFinish} disabled={!canNext || loading} type="button">
              {loading ? <Loader2 size={20} className="animate-spin" /> : '🚀 Start Tracking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
