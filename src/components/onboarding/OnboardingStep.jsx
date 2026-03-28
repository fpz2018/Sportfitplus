// Reusable building blocks for onboarding steps
import { Check } from 'lucide-react';

export function StepHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-6">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function OptionCard({ label, desc, selected, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
        selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
      }`}
    >
      {icon && <span className="text-xl shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
    </button>
  );
}

export function ToggleChip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
        selected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {selected && <Check className="w-3 h-3" />}
      {label}
    </button>
  );
}

export function SliderField({ label, value, min, max, step, onChange, leftLabel, rightLabel, valueColor }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">
        {label}: <span className={valueColor || 'text-primary'}>{value}</span>
      </label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(step % 1 === 0 ? parseInt(e.target.value) : parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}

export function NumberInput({ label, value, onChange, placeholder, unit }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {unit && <span className="text-muted-foreground text-sm w-8">{unit}</span>}
      </div>
    </div>
  );
}