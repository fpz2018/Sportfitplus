export default function CorrelationMatrix({ correlations }) {
  const items = Object.entries(correlations);

  // Create matrix from correlations
  const metrics = ['HRV', 'Gewicht', 'Slaap', 'Stress'];
  const matrix = {};

  metrics.forEach(m => {
    matrix[m] = {};
    metrics.forEach(m2 => {
      matrix[m][m2] = 0;
    });
  });

  // Populate matrix from correlation data
  Object.entries(correlations).forEach(([key, value]) => {
    const parts = key.split(' ↔ ');
    if (parts.length === 2) {
      const [m1, m2] = parts;
      if (matrix[m1] && matrix[m2]) {
        matrix[m1][m2] = value;
        matrix[m2][m1] = value;
      }
    }
  });

  const getColor = (value) => {
    if (value === 0) return 'bg-slate-700';
    const abs = Math.abs(value);
    if (value > 0) {
      if (abs >= 0.7) return 'bg-green-600';
      if (abs >= 0.4) return 'bg-green-500';
      return 'bg-green-400/50';
    } else {
      if (abs >= 0.7) return 'bg-red-600';
      if (abs >= 0.4) return 'bg-red-500';
      return 'bg-red-400/50';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-muted-foreground"></th>
            {metrics.map(m => (
              <th key={m} className="px-2 py-1 text-center text-muted-foreground">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(row => (
            <tr key={row}>
              <td className="px-2 py-1 text-muted-foreground font-medium">{row}</td>
              {metrics.map(col => {
                const value = matrix[row][col];
                return (
                  <td key={`${row}-${col}`} className={`px-2 py-1 text-center text-foreground font-mono ${getColor(value)}`}>
                    {value === 0 ? '—' : (value * 100).toFixed(0)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}