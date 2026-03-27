import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Link, Youtube, FileText, Loader2, CheckCircle, AlertCircle, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_ICONS = {
  pdf: FileText,
  youtube: Youtube,
  url: Link,
  google_drive: FileText
};

const STATUS_CONFIG = {
  wachten: { label: 'Wachten', color: 'text-yellow-400', icon: Clock },
  verwerken: { label: 'Verwerken...', color: 'text-blue-400', icon: Loader2 },
  klaar: { label: 'Klaar', color: 'text-green-400', icon: CheckCircle },
  fout: { label: 'Fout', color: 'text-red-400', icon: AlertCircle },
};

export default function BronBeheer() {
  const [bronnen, setBronnen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(null);
  const [form, setForm] = useState({ type: 'url', naam: '', url: '' });
  const [file, setFile] = useState(null);

  useEffect(() => { loadBronnen(); }, []);

  async function loadBronnen() {
    setLoading(true);
    const data = await base44.entities.BronBestand.list('-created_date', 50);
    setBronnen(data);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.naam.trim()) return;
    setUploading(true);

    let file_url = '';
    if (file && form.type === 'pdf') {
      const res = await base44.integrations.Core.UploadFile({ file });
      file_url = res.file_url;
    }

    await base44.entities.BronBestand.create({
      naam: form.naam,
      type: form.type,
      url: form.url || '',
      file_url,
      status: 'wachten'
    });

    setForm({ type: 'url', naam: '', url: '' });
    setFile(null);
    setUploading(false);
    loadBronnen();
  }

  async function handleAnalyse(bron) {
    setAnalysing(bron.id);
    await base44.entities.BronBestand.update(bron.id, { status: 'verwerken' });
    await base44.functions.invoke('analyseerBron', { bron_id: bron.id });
    await loadBronnen();
    setAnalysing(null);
  }

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" /> Bronbeheer
        </h1>
        <p className="text-muted-foreground text-sm">Upload documenten of links voor AI-analyse en wijzigingsvoorstellen</p>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-foreground">Nieuwe bron toevoegen</h2>

        {/* Type selector */}
        <div className="flex gap-2">
          {[{ value: 'url', label: '🌐 URL' }, { value: 'youtube', label: '▶️ YouTube' }, { value: 'pdf', label: '📄 PDF' }].map(t => (
            <button type="button" key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.type === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Naam / beschrijving *</label>
            <input value={form.naam} onChange={e => setForm(f => ({ ...f, naam: e.target.value }))} required
              placeholder="Bijv. Studie proteïne timing 2024"
              className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {form.type !== 'pdf' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL *</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} required
                placeholder={form.type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">PDF bestand</label>
              <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-muted-foreground" />
            </div>
          )}
        </div>

        <Button type="submit" disabled={uploading} className="w-full gap-2">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploaden...</> : <><Upload className="w-4 h-4" /> Bron toevoegen</>}
        </Button>
      </form>

      {/* Lijst */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : bronnen.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nog geen bronnen toegevoegd.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bronnen.map(bron => {
            const TypeIcon = TYPE_ICONS[bron.type] || Link;
            const statusConf = STATUS_CONFIG[bron.status] || STATUS_CONFIG.wachten;
            const StatusIcon = statusConf.icon;
            return (
              <div key={bron.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <TypeIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{bron.naam}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`flex items-center gap-1 text-xs ${statusConf.color}`}>
                      <StatusIcon className={`w-3 h-3 ${bron.status === 'verwerken' ? 'animate-spin' : ''}`} />
                      {statusConf.label}
                    </span>
                    {bron.aantal_voorstellen > 0 && (
                      <span className="text-xs text-muted-foreground">{bron.aantal_voorstellen} voorstellen</span>
                    )}
                    {bron.url && (
                      <a href={bron.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-xs">{bron.url}</a>
                    )}
                  </div>
                </div>
                {(bron.status === 'wachten' || bron.status === 'klaar') && (
                  <Button size="sm" variant="outline" onClick={() => handleAnalyse(bron)} disabled={analysing === bron.id} className="shrink-0 gap-1.5">
                    {analysing === bron.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Analyseer
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}