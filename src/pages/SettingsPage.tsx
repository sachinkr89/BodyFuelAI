import { useState, useEffect } from 'react';
import { User, Target, Dumbbell, Heart, LogOut, Calculator, Save, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { calculateTDEE, calculateDailyTargets } from '../utils/helpers';
import './SettingsPage.css';

export default function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuthStore();

  const [form, setForm] = useState({
    display_name: '',
    age: 0,
    weight_kg: 0,
    height_cm: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    activity_level: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain' | 'bulk' | 'cut',
    body_mode: 'general' as 'general' | 'gym',
  });
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        age: profile.age || 0,
        weight_kg: profile.weight_kg || 0,
        height_cm: profile.height_cm || 0,
        gender: profile.gender || 'male',
        activity_level: profile.activity_level || 'moderate',
        goal: profile.goal || 'maintain',
        body_mode: profile.body_mode || 'general',
      });
    }
  }, [profile]);

  const handleSave = async (section: string, data: Record<string, any>) => {
    setSaving(section);
    setSaved('');
    await updateProfile(data as any);
    setSaving('');
    setSaved(section);
    setTimeout(() => setSaved(''), 2000);
  };

  const handleRecalculate = async () => {
    const tdee = Math.round(calculateTDEE(form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level));
    const targets = calculateDailyTargets(tdee, form.goal, form.weight_kg);
    await handleSave('tdee', {
      ...form,
      tdee,
      daily_calorie_target: targets.calories,
      daily_protein_target: targets.protein_g,
    });
  };

  return (
    <div className="settings-page animate-fade-in">
      {/* Profile Section */}
      <div className="settings-section">
        <h2 className="settings-section-title"><User size={20} /> Profile</h2>
        <div className="settings-form">
          <div>
            <label className="settings-label">Display Name</label>
            <input className="input-field" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">Age</label>
              <input className="input-field" type="number" value={form.age || ''} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} />
            </div>
            <div>
              <label className="settings-label">Gender</label>
              <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <label className="settings-label">Weight (kg)</label>
              <input className="input-field" type="number" value={form.weight_kg || ''} onChange={(e) => setForm({ ...form, weight_kg: Number(e.target.value) })} />
            </div>
            <div>
              <label className="settings-label">Height (cm)</label>
              <input className="input-field" type="number" value={form.height_cm || ''} onChange={(e) => setForm({ ...form, height_cm: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="settings-label">Activity Level</label>
            <select className="input-field" value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value as any })}>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
          <div className="settings-actions">
            {saved === 'profile' && <span className="saved-text">✓ Saved</span>}
            <button className="btn-primary" onClick={() => handleSave('profile', form)} disabled={saving === 'profile'}>
              {saving === 'profile' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Profile
            </button>
          </div>
        </div>
      </div>

      {/* Goal Section */}
      <div className="settings-section">
        <h2 className="settings-section-title"><Target size={20} /> Fitness Goal</h2>
        <div className="settings-form">
          <div className="goal-grid">
            {(['lose', 'maintain', 'gain', 'bulk', 'cut'] as const).map((g) => (
              <button
                key={g}
                className={`option-card ${form.goal === g ? 'selected' : ''}`}
                onClick={() => setForm({ ...form, goal: g })}
                type="button"
              >
                <span className="option-card-title" style={{ textTransform: 'capitalize' }}>{g}</span>
              </button>
            ))}
          </div>
          <div className="settings-actions">
            {saved === 'goal' && <span className="saved-text">✓ Saved</span>}
            <button className="btn-primary" onClick={() => handleSave('goal', { goal: form.goal })} disabled={saving === 'goal'}>
              {saving === 'goal' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Update Goal
            </button>
          </div>
        </div>
      </div>

      {/* Mode Section */}
      <div className="settings-section">
        <h2 className="settings-section-title"><Dumbbell size={20} /> Dashboard Mode</h2>
        <div className="mode-switch">
          <button className={`mode-card general ${form.body_mode === 'general' ? 'selected' : ''}`} onClick={() => setForm({ ...form, body_mode: 'general' })} type="button">
            <Heart size={24} />
            <strong>General</strong>
            <p>Wellness focused</p>
          </button>
          <button className={`mode-card gym ${form.body_mode === 'gym' ? 'selected' : ''}`} onClick={() => setForm({ ...form, body_mode: 'gym' })} type="button">
            <Dumbbell size={24} />
            <strong>Gym</strong>
            <p>Athlete focused</p>
          </button>
        </div>
        <div className="settings-actions" style={{ marginTop: 16 }}>
          {saved === 'mode' && <span className="saved-text">✓ Saved</span>}
          <button className="btn-primary" onClick={() => handleSave('mode', { body_mode: form.body_mode })} disabled={saving === 'mode'}>
            {saving === 'mode' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Update Mode
          </button>
        </div>
      </div>

      {/* TDEE Section */}
      <div className="settings-section">
        <h2 className="settings-section-title"><Calculator size={20} /> TDEE & Targets</h2>
        <div className="tdee-display">
          <div className="tdee-display-row">
            <span>TDEE</span>
            <strong>{profile?.tdee ? `${Math.round(profile.tdee)} kcal/day` : 'Not calculated'}</strong>
          </div>
          <div className="tdee-display-row">
            <span>Calorie Target</span>
            <strong>{profile?.daily_calorie_target ? `${Math.round(profile.daily_calorie_target)} kcal` : '--'}</strong>
          </div>
          <div className="tdee-display-row">
            <span>Protein Target</span>
            <strong>{profile?.daily_protein_target ? `${Math.round(profile.daily_protein_target)}g` : '--'}</strong>
          </div>
        </div>
        <div className="settings-actions">
          {saved === 'tdee' && <span className="saved-text">✓ Recalculated & Saved</span>}
          <button className="btn-secondary" onClick={handleRecalculate} disabled={saving === 'tdee'}>
            {saving === 'tdee' ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
            Recalculate
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h2 className="settings-section-title"><LogOut size={20} /> Account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
          Sign out of your account.
        </p>
        <button className="btn-danger" onClick={signOut}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
