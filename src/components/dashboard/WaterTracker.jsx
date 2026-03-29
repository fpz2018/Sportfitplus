import { useState, useEffect } from 'react';
import { DailyLog } from '@/api/entities';
import { format } from 'date-fns';
import { Droplets, Plus, Minus } from 'lucide-react';

const GLAS_ML = 250; // 1 glas = 250ml
const DOEL_ML = 2500; // 2,5 liter standaard doel

export default function WaterTracker() {
  const [waterMl, setWaterMl] = useState(0);
  const [logId, setLogId] = useState(null);
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    laadVandaag();
  }, []);

  async function laadVandaag() {
    const log = await DailyLog.getByDate(today);
    if (log) {
      setWaterMl(log.water_ml || 0);
      setLogId(log.id);
    }
  }

  async function slaOp(nieuweWaarde) {
    setSaving(true);
    if (logId) {
      await DailyLog.update(logId, { water_ml: nieuweWaarde });
    } else {
      const nieuw = await DailyLog.create({ log_date: today, water_ml: nieuweWaarde });
      setLogId(nieuw.id);
    }
    setSaving(false);
  }

  async function voegGlasToe() {
    const nieuw = Math.min(waterMl + GLAS_ML, 9999);
    setWaterMl(nieuw);
    await slaOp(nieuw);
  }

  async function verwijderGlas() {
    const nieuw = Math.max(waterMl - GLAS_ML, 0);
    setWaterMl(nieuw);
    await slaOp(nieuw);
  }

  const glazen = Math.floor(waterMl / GLAS_ML);
  const doelGlazen = Math.ceil(DOEL_ML / GLAS_ML); // 10 glazen
  const pct = Math.min((waterMl / DOEL_ML) * 100, 100);
  const bereikt = waterMl >= DOEL_ML;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold text-foreground">Water vandaag</h2>
        </div>
        {bereikt && <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">🎉 Doel behaald!</span>}
      </div>

      {/* Glazen visualisatie */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {Array.from({ length: doelGlazen }).map((_, i) => (
          <div
            key={i}
            className={`w-7 h-9 rounded-md border-2 transition-all duration-300 flex items-end justify-center pb-0.5 ${
              i < glazen
                ? 'border-blue-400 bg-blue-400/20'
                : 'border-border bg-transparent'
            }`}
          >
            {i < glazen && <div className="w-3 h-5 rounded-sm bg-blue-400/60" />}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Info + knoppen */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(1)}L` : `${waterMl}ml`}
          </p>
          <p className="text-xs text-muted-foreground">van {DOEL_ML / 1000}L doel · {glazen}/{doelGlazen} glazen</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={verwijderGlas}
            disabled={waterMl === 0 || saving}
            className="w-10 h-10 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-30 flex items-center justify-center"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={voegGlasToe}
            disabled={saving}
            className="w-12 h-12 rounded-xl bg-blue-400/10 border border-blue-400/30 text-blue-400 hover:bg-blue-400/20 transition-all disabled:opacity-50 flex items-center justify-center font-bold"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
