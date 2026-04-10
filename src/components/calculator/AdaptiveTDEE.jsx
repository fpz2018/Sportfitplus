import { useState, useEffect, useMemo } from 'react';
import { DailyLog } from '@/api/entities';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const KCAL_PER_KG = 7700;
const MIN_DAYS = 7;

function calcEMA(values, smoothing = 0.2) {
  if (!values.length) return [];
  let ema = values[0];
  return values.map(v => {
    ema = smoothing * v + (1 - smoothing) * ema;
    return parseFloat(ema.toFixed(2));
  });
}

export default function AdaptiveTDEE({ currentTDEE, onSuggest }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DailyLog.list(30).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const analysis = useMemo(() => {
    // Sorteer chronologisch en filter op logs met zowel gewicht als calorieën
    const sorted = [...logs]
      .reverse()
      .filter(l => l.weight_kg != null && l.calories_eaten != null);

    if (sorted.length < MIN_DAYS) return null;

    const recent = sorted.slice(-14);
    const days = recent.length;

    // Gemiddelde calorie-intake
    const avgCalories = Math.round(
      recent.reduce((s, l) => s + l.calories_eaten, 0) / days
    );

    // EMA gewichtstrend
    const weights = recent.map(l => parseFloat(l.weight_kg));
    const emaWeights = calcEMA(weights);
    const trendStart = emaWeights[0];
    const trendEnd = emaWeights[emaWeights.length - 1];
    const weightChange = trendEnd - trendStart; // negatief = afgevallen

    // Dagelijks energiebalans op basis van gewichtsverandering
    const dailySurplus = (weightChange * KCAL_PER_KG) / days;

    // Geschatte werkelijke TDEE = wat je at minus het dagelijkse surplus
    // Als je afvalt: surplus is negatief, dus TDEE > intake
    const adaptiveTDEE = Math.round(avgCalories - dailySurplus);

    // Betrouwbaarheid op basis van hoeveelheid data
    const confidence = days >= 14 ? 'hoog' : days >= 10 ? 'gemiddeld' : 'laag';

    return {
      days,
      avgCalories,
      trendStart: trendStart.toFixed(1),
      trendEnd: trendEnd.toFixed(1),
      weightChange: weightChange.toFixed(2),
      adaptiveTDEE,
      confidence,
      diff: currentTDEE ? adaptiveTDEE - currentTDEE : null,
    };
  }, [logs, currentTDEE]);

  if (loading) return null;

  if (!analysis) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground">Adaptive TDEE</h3>
        </div>
        <div className="flex items-start gap-2 p-3 bg-secondary rounded-xl">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Log minimaal {MIN_DAYS} dagen je gewicht en calorieën om je werkelijke TDEE te berekenen.
            Je hebt nu {logs.filter(l => l.weight_kg && l.calories_eaten).length} bruikbare dagen.
          </p>
        </div>
      </div>
    );
  }

  const { days, avgCalories, trendStart, trendEnd, weightChange, adaptiveTDEE, confidence, diff } = analysis;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Adaptive TDEE</h3>
          <p className="text-xs text-muted-foreground">Berekend op basis van {days} dagen data</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-secondary rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Geschat TDEE</p>
          <p className="text-xl font-bold text-accent">{adaptiveTDEE}</p>
          <p className="text-xs text-muted-foreground">kcal/dag</p>
        </div>
        <div className="bg-secondary rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Gem. intake</p>
          <p className="text-xl font-bold text-foreground">{avgCalories}</p>
          <p className="text-xs text-muted-foreground">kcal/dag</p>
        </div>
        <div className="bg-secondary rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Gewichtstrend</p>
          <p className="text-xl font-bold text-foreground">{trendStart} → {trendEnd}</p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
        <div className="bg-secondary rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Verandering</p>
          <p className={`text-xl font-bold ${parseFloat(weightChange) <= 0 ? 'text-primary' : 'text-destructive'}`}>
            {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
          </p>
          <p className="text-xs text-muted-foreground">kg</p>
        </div>
      </div>

      {diff !== null && Math.abs(diff) > 50 && (
        <div className={`p-3 rounded-xl mb-4 ${Math.abs(diff) > 200 ? 'bg-accent/10 border border-accent/30' : 'bg-secondary'}`}>
          <p className="text-sm text-foreground">
            {diff > 0
              ? `Je werkelijke TDEE lijkt ~${Math.abs(diff)} kcal hoger dan je huidige instelling. Je kunt waarschijnlijk meer eten en nog steeds afvallen.`
              : `Je werkelijke TDEE lijkt ~${Math.abs(diff)} kcal lager dan je huidige instelling. Overweeg je doel-calorieën te verlagen.`}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${
          confidence === 'hoog' ? 'bg-primary/15 text-primary' :
          confidence === 'gemiddeld' ? 'bg-accent/15 text-accent' :
          'bg-secondary text-muted-foreground'
        }`}>
          Betrouwbaarheid: {confidence}
        </span>
        {onSuggest && (
          <button
            onClick={() => onSuggest(adaptiveTDEE)}
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-sm font-medium hover:bg-accent/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Toepassen
          </button>
        )}
      </div>
    </div>
  );
}
