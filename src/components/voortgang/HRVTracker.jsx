import { useState, useEffect } from 'react';
import { HRVLog } from '@/api/entities';
import { format } from 'date-fns';
import { Heart, Zap, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function HRVTracker({ onHRVLogged }) {
  const [mode, setMode] = useState(null); // 'handmatig' of 'vragenlijst'
  const [loading, setLoading] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Handmatige invoer
  const [hrvWaarde, setHrvWaarde] = useState('');

  // Vragenlijst
  const [slaap, setSlaap] = useState(7);
  const [stress, setStress] = useState(5);
  const [herstel, setHerstel] = useState(5);

  // Existing log van vandaag
  const [vandaagLog, setVandaagLog] = useState(null);

  useEffect(() => {
    laadVandaag();
  }, []);

  async function laadVandaag() {
    const log = await HRVLog.getByDate(today);
    if (log) setVandaagLog(log);
  }

  function berekenEnergiescore(hrv, slaapUren, stressNiveau, herstelGevoel) {
    // HRV normalisering: 20-180ms schaal
    const hrvScore = Math.min(Math.max((hrv - 20) / 160 * 40, 0), 40);
    
    // Slaap: 7-8 uur is ideaal
    const slaapScore = Math.max(0, Math.min((slaapUren / 8) * 30, 30));
    
    // Stress: lager is beter
    const stressScore = Math.max(0, (10 - stressNiveau) / 10 * 15);
    
    // Herstel: hoger is beter
    const herstelScore = (herstelGevoel / 10) * 15;
    
    const totaal = Math.round(hrvScore + slaapScore + stressScore + herstelScore);
    return totaal;
  }

  function bepaalTrainingReady(energiescore) {
    return energiescore >= 60;
  }

  async function opslaan(hrv, energiescore, trainingReady, bron, extra = {}) {
   setLoading(true);
   try {
     await HRVLog.create({
       log_date: today,
       hrv_waarde: Number(hrv),
       energiescore: Number(energiescore),
       training_ready: trainingReady,
       bron,
       ...extra,
     });
      setMode(null);
      setHrvWaarde('');
      setSlaap(7);
      setStress(5);
      setHerstel(5);
      await laadVandaag();
      onHRVLogged?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleHandmatig() {
    const hrv = parseFloat(hrvWaarde);
    if (!hrv || hrv < 10 || hrv > 250) {
      alert('Voer een HRV tussen 10-250ms in');
      return;
    }
    const energie = berekenEnergiescore(hrv, 7, 5, 5);
    const trainingReady = bepaalTrainingReady(energie);
    await opslaan(hrv, energie, trainingReady, 'handmatig');
  }

  async function handleVragenlijst() {
    // Geschatte HRV op basis van vragenlijst: 40-120ms range
    const hrvEstimate = Math.round(40 + (slaap * 8) - (stress * 3) + (herstel * 2));
    const energie = Math.round(berekenEnergiescore(hrvEstimate, slaap, stress, herstel));

    if (!Number.isInteger(hrvEstimate) || !Number.isInteger(energie) || hrvEstimate < 10 || energie < 0 || energie > 100) {
      alert('Fout bij berekening. Probeer opnieuw.');
      return;
    }

    const trainingReady = bepaalTrainingReady(energie);
    await opslaan(hrvEstimate, energie, trainingReady, 'vragenlijst', {
      slaap_uren: Number(slaap),
      stress_niveau: Number(stress),
      herstel_gevoel: Number(herstel),
    });
  }

  if (vandaagLog) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-destructive" />
              <h3 className="font-semibold text-foreground">HRV & Energiescore</h3>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">HRV: <span className="text-foreground font-medium">{vandaagLog.hrv_waarde}ms</span></p>
              <p className="text-sm text-muted-foreground">Bron: <span className="text-foreground font-medium capitalize">{vandaagLog.bron}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{vandaagLog.energiescore}</p>
            <p className="text-xs text-muted-foreground">energiescore</p>
          </div>
        </div>

        {/* Training readiness */}
        <div className={`mt-4 p-3 rounded-xl border flex items-start gap-3 ${vandaagLog.training_ready ? 'bg-primary/10 border-primary/30' : 'bg-accent/10 border-accent/30'}`}>
          {vandaagLog.training_ready ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-primary">Training ready! 💪</p>
                <p className="text-xs text-primary/70">Je energiescore is hoog genoeg voor intensieve training</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-accent">Rustdag aanbevolen 😴</p>
                <p className="text-xs text-accent/70">Je energiescore suggereert lichte training of rust vandaag</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-destructive" />
        <h3 className="font-semibold text-foreground">HRV & Energiescore</h3>
      </div>

      {!mode ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">Bepaal je energiescore om te checken of je training-ready bent</p>
          <button
            onClick={() => setMode('handmatig')}
            className="w-full p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all text-sm font-medium text-foreground"
          >
            📱 Ik heb HRV-data van mijn device
          </button>
          <button
            onClick={() => setMode('vragenlijst')}
            className="w-full p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all text-sm font-medium text-foreground"
          >
            ❓ Ik wil de vragenlijst invullen
          </button>
        </div>
      ) : mode === 'handmatig' ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">HRV waarde (ms)</label>
            <input
              type="number"
              value={hrvWaarde}
              onChange={e => setHrvWaarde(e.target.value)}
              placeholder="bijv. 65"
              min="10"
              max="250"
              className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Typisch 20-180ms (lager = meer stress, hoger = beter herstel)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode(null)}
              className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all text-sm font-medium"
            >
              Terug
            </button>
            <button
              onClick={handleHandmatig}
              disabled={loading || !hrvWaarde}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Opslaan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {[
            { label: 'Slaap afgelopen nacht', value: slaap, setValue: setSlaap, unit: 'uur', min: 0, max: 12, step: 0.5 },
            { label: 'Stressniveau', value: stress, setValue: setStress, unit: '(1-10)', min: 1, max: 10, step: 1 },
            { label: 'Hersteld gevoel', value: herstel, setValue: setHerstel, unit: '(1-10)', min: 1, max: 10, step: 1 },
          ].map(({ label, value, setValue, unit, min, max, step }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <label className="font-medium text-foreground">{label}</label>
                <span className="text-primary font-bold">{value} {unit}</span>
              </div>
              <input
                type="range"
                value={value}
                onChange={e => setValue(parseFloat(e.target.value))}
                min={min}
                max={max}
                step={step}
                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
              />
            </div>
          ))}

          {/* Preview */}
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">Geschatte energiescore:</p>
            <p className="text-2xl font-bold text-primary">{Math.round(berekenEnergiescore(50, slaap, stress, herstel))}/100</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setMode(null)}
              className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-all text-sm font-medium"
            >
              Terug
            </button>
            <button
              onClick={handleVragenlijst}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Berekenen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}