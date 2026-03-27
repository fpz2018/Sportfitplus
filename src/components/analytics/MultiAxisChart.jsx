import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MultiAxisChart({ dailyLogs, hrvLogs }) {
  // Merge and prepare data
  const data = dailyLogs
    .filter(log => log.log_date && log.weight_kg)
    .map(log => {
      const hrv = hrvLogs.find(h => h.log_date === log.log_date);
      return {
        date: new Date(log.log_date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' }),
        weight: log.weight_kg,
        hrv: hrv?.hrv_waarde || null,
        sleep: hrv?.slaap_uren || null,
      };
    })
    .slice(-30)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 20, right: 80, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
        
        {/* Left Y-axis: Weight */}
        <YAxis
          yAxisId="left"
          stroke="hsl(var(--primary))"
          style={{ fontSize: '12px' }}
          label={{ value: 'Gewicht (kg)', angle: -90, position: 'insideLeft' }}
        />
        
        {/* Right Y-axis: HRV & Sleep */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="hsl(var(--accent))"
          style={{ fontSize: '12px' }}
          label={{ value: 'HRV (ms) / Slaap (uur)', angle: 90, position: 'insideRight' }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
        />
        <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />

        {/* Weight as line on left axis */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))', r: 3 }}
          name="Gewicht"
        />

        {/* HRV as line on right axis */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="hrv"
          stroke="hsl(var(--accent))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--accent))', r: 3 }}
          name="HRV"
        />

        {/* Sleep as bars on right axis */}
        <Bar
          yAxisId="right"
          dataKey="sleep"
          fill="hsl(var(--secondary))"
          name="Slaap (uur)"
          opacity={0.6}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}