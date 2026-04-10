import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { WijzigingsVoorstel, AuditLog } from '@/api/entities';
import { callFunction } from '@/api/netlifyClient';
import { Lightbulb, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_LABELS = { pending: 'In behandeling', approved: 'Goedgekeurd', rejected: 'Afgewezen', applied: 'Toegepast' };

function BetrouwbaarheidBalk({ score }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-secondary rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8">{score}%</span>
    </div>
  );
}

function DiffWeergave({ huidig, nieuw }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
        <p className="text-red-400 font-medium mb-1.5">Huidige waarde</p>
        <p className="text-foreground">{huidig || '(leeg / nieuw)'}</p>
      </div>
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
        <p className="text-green-400 font-medium mb-1.5">Voorgestelde waarde</p>
        <p className="text-foreground">{nieuw}</p>
      </div>
    </div>
  );
}

export default function InhoudsVoorstellen() {
  const { user } = useAuth();
  const [voorstellen, setVoorstellen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [notes, setNotes] = useState({});

  useEffect(() => {
    loadVoorstellen();
  }, []);

  async function loadVoorstellen() {
    setLoading(true);
    const data = await WijzigingsVoorstel.list();
    setVoorstellen(data);
    setLoading(false);
  }

  async function handleReview(voorstel, status) {
    await WijzigingsVoorstel.update(voorstel.id, {
      status: status === 'approve' ? 'approved' : 'rejected',
      reviewed_by: user?.email,
      reviewed_at: new Date().toISOString(),
      review_notes: notes[voorstel.id] || ''
    });
    await AuditLog.create({
      actie: status === 'approve' ? 'voorstel_goedgekeurd' : 'voorstel_afgewezen',
      gebruiker: user?.email,
      entity_naam: 'WijzigingsVoorstel',
      record_id: voorstel.id,
      details: `Voorstel voor ${voorstel.entity_naam}.${voorstel.veld_naam} ${status === 'approve' ? 'goedgekeurd' : 'afgewezen'}`
    });
    loadVoorstellen();
  }

  async function handleApply(voorstel) {
    // Mark as applied + log
    await WijzigingsVoorstel.update(voorstel.id, {
      status: 'applied',
      applied_at: new Date().toISOString()
    });
    await AuditLog.create({
      actie: 'voorstel_toegepast',
      gebruiker: user?.email,
      entity_naam: voorstel.entity_naam,
      record_id: voorstel.record_id || voorstel.id,
      details: `Veld "${voorstel.veld_naam}" bijgewerkt: ${voorstel.voorgestelde_waarde?.substring(0, 100)}`
    });
    // Stuur notificaties naar alle users
    await callFunction('notifyOnProposalApplied', { voorstel_id: voorstel.id });
    loadVoorstellen();
  }

  const filtered = voorstellen.filter(v => filterStatus === 'all' || v.status === filterStatus);
  const pending = voorstellen.filter(v => v.status === 'pending').length;

  return (
    <div className="p-6 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-accent" /> Inhoudsvoorstellen
          </h1>
          <p className="text-muted-foreground text-sm">{pending} voorstellen wachten op beoordeling</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['all', 'pending', 'approved', 'rejected', 'applied'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterStatus === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
            {s === 'all' ? 'Alle' : STATUS_LABELS[s]}
            {s === 'pending' && pending > 0 && <span className="ml-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-xs">{pending}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Geen voorstellen gevonden. Upload een bron om voorstellen te genereren.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                className="w-full flex items-start justify-between p-5 text-left hover:bg-secondary/30 transition-all">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-mono">{v.entity_naam}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{v.veld_naam}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'approved' || v.status === 'applied' ? 'bg-green-500/20 text-green-400' : v.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{v.bron_naam}</p>
                  <div className="mt-2 max-w-xs">
                    <BetrouwbaarheidBalk score={v.betrouwbaarheid || 0} />
                  </div>
                </div>
                {expanded === v.id ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
              </button>

              {expanded === v.id && (
                <div className="border-t border-border p-5 space-y-4">
                  <DiffWeergave huidig={v.huidige_waarde} nieuw={v.voorgestelde_waarde} />

                  {v.onderbouwing_nl && (
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1">AI-onderbouwing</p>
                      <p className="text-sm text-foreground">{v.onderbouwing_nl}</p>
                    </div>
                  )}

                  {v.status === 'pending' && (
                    <div className="space-y-3">
                      <textarea
                        value={notes[v.id] || ''}
                        onChange={e => setNotes(n => ({ ...n, [v.id]: e.target.value }))}
                        placeholder="Optionele notitie..."
                        className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-16"
                      />
                      <div className="flex gap-3">
                        <Button onClick={() => handleReview(v, 'approve')} className="gap-2 flex-1" size="sm">
                          <CheckCircle className="w-4 h-4" /> Goedkeuren
                        </Button>
                        <Button onClick={() => handleReview(v, 'reject')} variant="destructive" className="gap-2 flex-1" size="sm">
                          <XCircle className="w-4 h-4" /> Afwijzen
                        </Button>
                      </div>
                    </div>
                  )}

                  {v.status === 'approved' && (
                    <Button onClick={() => handleApply(v)} className="w-full gap-2" variant="outline" size="sm">
                      <CheckCircle className="w-4 h-4 text-green-400" /> Doorvoeren in database
                    </Button>
                  )}

                  {v.reviewed_by && (
                    <p className="text-xs text-muted-foreground">Beoordeeld door {v.reviewed_by} op {new Date(v.reviewed_at).toLocaleDateString('nl-NL')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
