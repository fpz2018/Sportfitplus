import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { UserProfile, DailyLog, HRVLog } from '@/api/entities';
import { Loader2, TrendingUp, Activity, Moon, Zap } from 'lucide-react';
import CorrelationMatrix from '@/components/analytics/CorrelationMatrix';
import MultiAxisChart from '@/components/analytics/MultiAxisChart';
import CorrelationStats from '@/components/analytics/CorrelationStats';

export default function CoachAnalytics() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [hrvLogs, setHrvLogs] = useState([]);
  const [correlations, setCorrelations] = useState({});
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Only admins can access
      if (profile?.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        // Load all users for selection
        const users = await UserProfile.listAll();
        setAllUsers(users);

        // Load current user's data by default
        await loadOwnAnalytics();
      } catch (err) {
        console.error('Fout bij laden analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    if (profile !== undefined) loadData();
  }, [profile]);

  async function loadOwnAnalytics() {
    const [logs, hrv] = await Promise.all([
      DailyLog.list(100),
      HRVLog.list(100),
    ]);
    setDailyLogs(logs);
    setHrvLogs(hrv);
    calculateCorrelations(logs, hrv);
  }

  function calculateCorrelations(logs, hrv) {
    // Merge data by date
    const mergedData = {};

    logs.forEach(log => {
      if (!mergedData[log.log_date]) {
        mergedData[log.log_date] = {};
      }
      mergedData[log.log_date].weight = log.weight_kg;
      mergedData[log.log_date].calories = log.calories_eaten;
      mergedData[log.log_date].training = log.training_done ? 1 : 0;
    });

    hrv.forEach(h => {
      if (!mergedData[h.log_date]) {
        mergedData[h.log_date] = {};
      }
      mergedData[h.log_date].hrv = h.hrv_waarde;
      mergedData[h.log_date].sleep = h.slaap_uren;
      mergedData[h.log_date].stress = h.stress_niveau;
    });

    const dataArray = Object.values(mergedData).filter(d => d.weight && d.hrv && d.sleep);

    // Calculate Pearson correlation
    const pearsonCorr = (x, y) => {
      const n = x.length;
      const meanX = x.reduce((a, b) => a + b) / n;
      const meanY = y.reduce((a, b) => a + b) / n;
      const num = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
      const denom = Math.sqrt(
        x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0) *
        y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0)
      );
      return denom === 0 ? 0 : num / denom;
    };

    if (dataArray.length > 2) {
      const weights = dataArray.map(d => d.weight);
      const hrvs = dataArray.map(d => d.hrv);
      const sleeps = dataArray.map(d => d.sleep);
      const stresses = dataArray.map(d => d.stress);

      setCorrelations({
        'HRV ↔ Gewicht': pearsonCorr(hrvs, weights),
        'Slaap ↔ Gewicht': pearsonCorr(sleeps, weights),
        'Slaap ↔ HRV': pearsonCorr(sleeps, hrvs),
        'Stress ↔ HRV': pearsonCorr(stresses, hrvs),
        'Stress ↔ Slaap': pearsonCorr(stresses, sleeps),
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 font-medium">Alleen coaches hebben toegang tot dit dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-8 h-8 text-accent" />
          Coach Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Diepgaande correlatie-analyses voor volgers</p>
      </div>

      {/* User Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Analyseer gebruiker</label>
        <select
          defaultValue={user?.email}
          onChange={() => {}} // RLS restricts data to own user only
          className="w-full max-w-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={user?.email}>{profile?.full_name || user?.email} (jij)</option>
          {allUsers.filter(u => u.id !== user?.id).map(u => (
            <option key={u.id} value={u.email}>{u.full_name || u.email}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Moon} label="Gemiddelde Slaap" value={hrvLogs.length > 0 ? (hrvLogs.reduce((sum, h) => sum + h.slaap_uren, 0) / hrvLogs.length).toFixed(1) : '—'} unit="uur" />
        <StatCard icon={Zap} label="Gemiddelde HRV" value={hrvLogs.length > 0 ? (hrvLogs.reduce((sum, h) => sum + h.hrv_waarde, 0) / hrvLogs.length).toFixed(0) : '—'} unit="ms" />
        <StatCard icon={Activity} label="Trainingen" value={dailyLogs.filter(l => l.training_done).length} unit="dagen" />
        <StatCard icon={TrendingUp} label="Datapunten" value={dailyLogs.filter(l => l.weight_kg && hrvLogs.find(h => h.log_date === l.log_date)).length} unit="gekoppeld" />
      </div>

      {/* Multi-Axis Chart */}
      {dailyLogs.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Timeline: Slaap, HRV & Gewicht</h2>
          <MultiAxisChart dailyLogs={dailyLogs} hrvLogs={hrvLogs} />
        </div>
      )}

      {/* Correlation Stats */}
      {Object.keys(correlations).length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Correlatie-sterkte</h2>
            <CorrelationStats correlations={correlations} />
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Correlatie Matrix</h2>
            <CorrelationMatrix correlations={correlations} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {dailyLogs.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Onvoldoende data voor analyse. Gebruiker moet dagelijkse logs en HRV-metingen hebben.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-accent" />
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
    </div>
  );
}
