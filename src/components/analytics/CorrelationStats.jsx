export default function CorrelationStats({ correlations }) {
  const getStrength = (value) => {
    const abs = Math.abs(value);
    if (abs >= 0.7) return { label: 'Sterk', color: 'text-green-400' };
    if (abs >= 0.4) return { label: 'Gemiddeld', color: 'text-yellow-400' };
    if (abs >= 0.1) return { label: 'Zwak', color: 'text-orange-400' };
    return { label: 'Geen', color: 'text-slate-400' };
  };

  const getBarWidth = (value) => {
    return Math.abs(value) * 100;
  };

  return (
    <div className="space-y-4">
      {Object.entries(correlations)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .map(([label, value]) => {
          const strength = getStrength(value);
          return (
            <div key={label}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium text-foreground">{label}</p>
                <span className={`text-xs font-bold ${strength.color}`}>
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    value > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${getBarWidth(value)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${strength.color}`}>{strength.label}</p>
            </div>
          );
        })}
    </div>
  );
}