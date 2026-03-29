import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { DailyLog, WijzigingsVoorstel } from '@/api/entities';
import { TrendingUp, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProgressChart from '@/components/dashboard/ProgressChart';
import ChangesFeedback from '@/components/dashboard/ChangesFeedback';

export default function MijnVoortgang() {
  const { profile } = useAuth();
  const [dailyLogs, setDailyLogs] = useState([]);
  const [appliedChanges, setAppliedChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChangeId, setSelectedChangeId] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [logs, changes] = await Promise.all([
        DailyLog.list(100),
        WijzigingsVoorstel.list('applied'),
      ]);
      setDailyLogs(logs);
      setAppliedChanges(changes);

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Extract weight data for chart
  const weightData = dailyLogs
    .filter(log => log.weight_kg)
    .sort((a, b) => new Date(a.log_date) - new Date(b.log_date))
    .map(log => ({
      date: new Date(log.log_date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' }),
      weight: log.weight_kg
    }));

  // Get latest weight
  const latestWeight = dailyLogs.find(log => log.weight_kg)?.weight_kg;
  const weightChange = weightData.length > 1 ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1) : null;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          Mijn Voortgang
        </h1>
        <p className="text-muted-foreground mt-1">Volg je voortgang en geef feedback op aangepaste schema's</p>
      </div>

      {/* Progress Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Weight Card */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Huidige Gewicht</p>
          <p className="text-2xl font-bold text-foreground">{latestWeight ? `${latestWeight} kg` : '—'}</p>
          {weightChange !== null && (
            <p className={`text-xs mt-2 ${parseFloat(weightChange) < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} kg (laatste 30 dagen)
            </p>
          )}
        </div>

        {/* Total Logs */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Ingevulde Dagen</p>
          <p className="text-2xl font-bold text-foreground">{dailyLogs.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Afgelopen 30 dagen</p>
        </div>

        {/* Applied Changes */}
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground mb-1">Toegepaste Wijzigingen</p>
          <p className="text-2xl font-bold text-foreground">{appliedChanges.length}</p>
          <p className="text-xs text-muted-foreground mt-2">Wetenschappelijk inzicht</p>
        </div>
      </div>

      {/* Weight Progress Chart */}
      {weightData.length > 1 && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Gewichtsverloop</h2>
          <ProgressChart data={weightData} dataKey="weight" />
        </div>
      )}

      {/* Applied Changes Feedback */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-accent" />
          Feedback op Wijzigingen
        </h2>

        {appliedChanges.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
            <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nog geen wijzigingen toegepast op je schema.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appliedChanges.map(change => (
              <ChangesFeedback
                key={change.id}
                change={change}
                isExpanded={selectedChangeId === change.id}
                onToggle={() => setSelectedChangeId(selectedChangeId === change.id ? null : change.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
