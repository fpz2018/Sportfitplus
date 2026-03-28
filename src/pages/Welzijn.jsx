import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, subDays } from 'date-fns';
import { Heart, Moon, Zap, Brain, Sparkles, Loader2, CheckCircle2, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react';

const today = format(new Date(), 'yyyy-MM-dd');

// ─── HRV Sectie ────────────────────────────────────────────────────────────────
function HRVSectie({ onLogged }) {
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [vandaagLog, setVandaagLog] = useState(null);
  const [history, setHistory] = useState([]);
  const [hrvWaarde, setHrvWaarde] = useState('');
  const [slaap, setSlaap] = useState(7);
  const [stress, setStress] = useState(5);
  const [herstel, setHerstel] = useState(5);

  useEffect(() => { laad(); }, []);

  async function laad() {
    const u = await base44.auth.me();
    const [logs, hist] = await Promise.all([
      base44.entities.HRVLog.filter({ created_by: u.email, log_date: today }),
      base44.entities.HRVLog.list('-log_date', 14),
    ]);
    if (logs.length > 0) setVandaagLog(logs[0]);
    setHistory(hist.filter(l => l.created_by === u.email));
  }

  function berekenEnergiescore(hrv, slaapUren, stressNiveau, herstelGevoel) {
    const hrvScore = Math.min(Math.max((hrv - 20) / 160 * 40, 0), 40);
    const slaapScore = Math.max(0, Math.min((slaapUren / 8) * 30, 30));
    const stressScore = Math.max(0, (10 - stressNiveau) / 10 * 15);
    const herstelScore = (herstelGevoel / 10) * 15;
    return Math.round(hrvScore + slaapScore + stressScore + herstelScore);
  }

  async function opslaan(hrv, energiescore, trainingReady, bron, extra = {}) {
    setLoading(true);
    await base44.entities.HRVLog.create({
      log_date: today, hrv_waarde: Number(hrv), energiescore: Number(energiescore),
      training_ready: trainingReady, bron, ...extra,
    });
    setMode(null); setHrvWaarde(''); setSlaap(7); setStress(5); setHerstel(5);
    await laad();
    onLogged?.();
    setLoading(false);
  }

  async function handleHandmatig() {
    const hrv = parseFloat(hrvWaarde);
    if (!hrv || hrv < 10 || hrv > 250) return alert('Voer een HRV tussen 10-250ms in');
    const energie = berekenEnergiescore(hrv, 7, 5, 5);
    await opslaan(hrv, energie, energie >= 60, 'handmatig');
  }

  async function handleVragenlijst() {
    const hrvEstimate = Math.round(40 + (slaap * 8) - (stress * 3) + (herstel * 2));
    const energie = berekenEnergiescore(hrvEstimate, slaap, stress, herstel);
    await opslaan(hrvEstimate, energie, energie >= 60, 'vragenlijst', {
      slaap_uren: Number(slaap), stress_niveau: Number(stress), herstel_gevoel: Number(herstel),
    });
  }

  const avgHrv = history.length > 0 ? Math.round(history.reduce((s, l) => s + l.hrv_waarde, 0) / history.length) : null;
  const avgEnergy = history.length > 0 ? Math.round(history.reduce((s, l) => s + l.energiescore, 0) / history.length) : null;

  return (
    <div className="space-y-4">
      {/* Vandaag */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-destructive" />
          <h2 className="font-semibold text-foreground">HRV & Energiescore</h2>
        </div>

        {vandaagLog ? (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">HRV: <span className="text-foreground font-semibold">{vandaagLog.hrv_waarde}ms</span></p>
                <p className="text-sm text-muted-foreground">Bron: <span className="text-foreground font-medium capitalize">{vandaagLog.bron}</span></p>
                {vandaagLog.slaap_uren && <p className="text-sm text-muted-foreground">Slaap: <span className="text-foreground font-medium">{vandaagLog.slaap_uren}u</span></p>}
                {vandaagLog.stress_niveau && <p className="text-sm text-muted-foreground">Stress: <span className="text-foreground font-medium">{vandaagLog.stress_niveau}/10</span></p>}
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-primary">{vandaagLog.energiescore}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </div>
            </div>
            <div className={`p-3 rounded-xl border flex items-start gap-3 ${vandaagLog.training_ready ? 'bg-primary/10 border-primary/30' : 'bg-accent/10 border-accent/30'}`}>
              {vandaagLog.training_ready
                ? <><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /><div className="text-sm"><p className="font-medium text-primary">Training ready! 💪</p><p className="text-xs text-primary/70">Je energiescore is hoog genoeg voor intensieve training</p></div></>
                : <><AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" /><div className="text-sm"><p className="font-medium text-accent">Rustdag aanbevolen 😴</p><p className="text-xs text-accent/70">Je energiescore suggereert lichte training of rust vandaag</p></div></>
              }
            </div>
            <button onClick={() => setVandaagLog(null)} className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-all">
              <RefreshCw className="w-3 h-3" /> Opnieuw invoeren
            </button>
          </div>
        ) : !mode ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">Bepaal je energiescore om te checken of je training-ready bent</p>
            <button onClick={() => setMode('handmatig')} className="w-full p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all text-sm font-medium text-foreground">
              📱 Ik heb HRV-data van mijn device
            </button>
            <button onClick={() => setMode('vragenlijst')} className="w-full p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all text-sm font-medium text-foreground">
              ❓ Ik wil de vragenlijst invullen
            </button>
          </div>
        ) : mode === 'handmatig' ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">HRV waarde (ms)</label>
              <input type="number" value={hrvWaarde} onChange={e => setHrvWaarde(e.target.value)} placeholder="bijv. 65" min="10" max="250"
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              <p className="text-xs text-muted-foreground mt-1">Typisch 20-180ms (lager = meer stress, hoger = beter herstel)</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode(null)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm">Terug</button>
              <button onClick={handleHandmatig} disabled={loading || !hrvWaarde}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Opslaan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Slaap afgelopen nacht', value: slaap, setValue: setSlaap, unit: 'uur', min: 0, max: 12, step: 0.5 },
              { label: 'Stressniveau', value: stress, setValue: setStress, unit: '/10', min: 1, max: 10, step: 1 },
              { label: 'Hersteld gevoel', value: herstel, setValue: setHerstel, unit: '/10', min: 1, max: 10, step: 1 },
            ].map(({ label, value, setValue, unit, min, max, step }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <label className="font-medium text-foreground">{label}</label>
                  <span className="text-primary font-bold">{value}{unit}</span>
                </div>
                <input type="range" value={value} onChange={e => setValue(parseFloat(e.target.value))} min={min} max={max} step={step}
                  className="w-full accent-primary" />
              </div>
            ))}
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Geschatte energiescore</p>
              <p className="text-3xl font-bold text-primary">{berekenEnergiescore(40 + slaap * 8 - stress * 3 + herstel * 2, slaap, stress, herstel)}<span className="text-sm text-muted-foreground">/100</span></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode(null)} className="flex-1 py-2.5 rounded-lg border border-border text-muted-foreground text-sm">Terug</button>
              <button onClick={handleVragenlijst} disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} Berekenen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 14-daagse statistieken */}
      {history.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">Trend (14 dagen)</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Gem. HRV</p>
              <p className="text-2xl font-bold text-foreground">{avgHrv}<span className="text-sm text-muted-foreground">ms</span></p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Gem. energie</p>
              <p className="text-2xl font-bold text-primary">{avgEnergy}<span className="text-sm text-muted-foreground">/100</span></p>
            </div>
          </div>
          <div className="space-y-2">
            {history.slice(0, 7).map(log => (
              <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                <span className="text-muted-foreground">{format(new Date(log.log_date), 'dd MMM')}</span>
                <span className="text-foreground">{log.hrv_waarde}ms</span>
                <span className={`font-semibold ${log.training_ready ? 'text-primary' : 'text-accent'}`}>{log.energiescore}/100</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${log.training_ready ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {log.training_ready ? '✓ Ready' : '😴 Rust'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Welzijn Check-in ──────────────────────────────────────────────────────────
function WelzijnCheckIn() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAdvies, setAiAdvies] = useState(null);
  const [loadingAdvies, setLoadingAdvies] = useState(false);
  const [slaap, setSlaap] = useState(7);
  const [slaapKwaliteit, setSlaapKwaliteit] = useState('goed');
  const [stress, setStress] = useState(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ created_by: u.email });
      if (profiles.length > 0) {
        const p = profiles[0];
        setProfile(p);
        setSlaap(p.slaap_uren || 7);
        setSlaapKwaliteit(p.slaap_kwaliteit || 'goed');
        setStress(p.stress_niveau || 5);
        if (p.ai_welzijn_advies) setAiAdvies(p.ai_welzijn_advies);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function opslaanCheckIn() {
    if (!profile) return;
    await base44.entities.UserProfile.update(profile.id, {
      slaap_uren: slaap, slaap_kwaliteit: slaapKwaliteit, stress_niveau: stress,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function genereerAdvies() {
    setLoadingAdvies(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Je bent een welzijns- en herstelcoach. Geef gepersonaliseerd advies voor slaap, stress en herstel op basis van:
- Slaap: ${slaap} uur per nacht (kwaliteit: ${slaapKwaliteit})
- Stressniveau: ${stress}/10
- Profiel: ${profile?.hoofd_doel || 'gezond blijven'}, ${profile?.training_ervaring || 'beginner'}, ${profile?.lifestyle || 'kantoorwerk'}
- Ontspanning: ${profile?.meditatie_of_ontspanning ? profile.ontspanning_methode || 'ja' : 'geen'}
- Herstel prioriteit: ${profile?.herstel_prioriteit ? 'ja' : 'nee'}

Geef 3-4 concrete, praktische tips specifiek voor dit profiel. Schrijf in het Nederlands, vriendelijk en motiverend.`,
    });
    if (res && profile) {
      setAiAdvies(res);
      await base44.entities.UserProfile.update(profile.id, { ai_welzijn_advies: res });
    }
    setLoadingAdvies(false);
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      {/* Check-in kaart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-foreground">Slaap & Stress check-in</h2>
        </div>

        <div className="space-y-5">
          {/* Slaap uren */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="font-medium text-foreground">Slaap afgelopen nacht</label>
              <span className="text-primary font-bold">{slaap} uur</span>
            </div>
            <input type="range" min={3} max={12} step={0.5} value={slaap} onChange={e => setSlaap(parseFloat(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>3u</span><span>12u</span></div>
          </div>

          {/* Slaapkwaliteit */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Slaapkwaliteit</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { v: 'slecht', l: '😫 Slecht' },
                { v: 'matig', l: '😐 Matig' },
                { v: 'goed', l: '😊 Goed' },
                { v: 'uitstekend', l: '😴 Super' },
              ].map(({ v, l }) => (
                <button key={v} onClick={() => setSlaapKwaliteit(v)}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all text-center ${slaapKwaliteit === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label className="font-medium text-foreground">Stressniveau vandaag</label>
              <span className={`font-bold ${stress >= 7 ? 'text-destructive' : stress >= 5 ? 'text-accent' : 'text-primary'}`}>{stress}/10</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={stress} onChange={e => setStress(parseInt(e.target.value))}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Ontspannen</span><span>Veel stress</span></div>
          </div>

          <button onClick={opslaanCheckIn}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${saved ? 'bg-green-600 text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}>
            {saved ? '✓ Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </div>

      {/* Ontspanning & herstel uit profiel */}
      {profile && (profile.meditatie_of_ontspanning || profile.ontspanning_methode) && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-foreground text-sm">Jouw ontspanningsmethodes</h3>
          </div>
          {profile.ontspanning_methode && (
            <div className="flex flex-wrap gap-2">
              {profile.ontspanning_methode.split(',').map(m => m.trim()).filter(Boolean).map(m => (
                <span key={m} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-xl text-xs font-medium border border-purple-500/20">{m}</span>
              ))}
            </div>
          )}
          {profile.herstel_prioriteit && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Herstel is een prioriteit voor jou</p>
          )}
        </div>
      )}

      {/* AI Welzijn advies */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground text-sm">AI Welzijn Advies</h3>
          </div>
          <button onClick={genereerAdvies} disabled={loadingAdvies}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-60">
            {loadingAdvies ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {aiAdvies ? 'Vernieuwen' : 'Genereer'}
          </button>
        </div>
        {aiAdvies ? (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiAdvies}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Klik "Genereer" voor persoonlijk advies op basis van jouw slaap, stress en hersteldoelen.</p>
        )}
      </div>
    </div>
  );
}

// ─── Hoofd pagina ─────────────────────────────────────────────────────────────
export default function Welzijn() {
  const [activeTab, setActiveTab] = useState('hrv');

  const tabs = [
    { id: 'hrv', label: 'HRV & Energie', icon: Heart },
    { id: 'welzijn', label: 'Slaap & Stress', icon: Moon },
  ];

  return (
    <div className="p-4 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" /> Herstel & Welzijn
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Slaap, stress, HRV en persoonlijk hersteladvies</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'hrv' && <HRVSectie />}
      {activeTab === 'welzijn' && <WelzijnCheckIn />}
    </div>
  );
}