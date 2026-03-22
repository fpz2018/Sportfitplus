import { useState } from 'react';
import { Plus, Trash2, X, Save, GripVertical } from 'lucide-react';

const emptyOefening = () => ({ naam: '', sets: '3x10', rust: '90s', tip: '' });
const emptyDag = () => ({ dag_naam: '', oefeningen: [emptyOefening()] });

export default function CustomSchemaEditor({ schema, onSave, onClose }) {
  const [name, setName] = useState(schema?.name || '');
  const [description, setDescription] = useState(schema?.description || '');
  const [days, setDays] = useState(
    schema?.days?.length ? schema.days : [emptyDag()]
  );
  const [saving, setSaving] = useState(false);

  function updateDay(dIdx, field, value) {
    setDays(d => d.map((day, i) => i === dIdx ? { ...day, [field]: value } : day));
  }

  function addDay() {
    setDays(d => [...d, emptyDag()]);
  }

  function removeDay(dIdx) {
    setDays(d => d.filter((_, i) => i !== dIdx));
  }

  function updateOefening(dIdx, oIdx, field, value) {
    setDays(d => d.map((day, i) => i !== dIdx ? day : {
      ...day,
      oefeningen: day.oefeningen.map((oe, j) => j === oIdx ? { ...oe, [field]: value } : oe)
    }));
  }

  function addOefening(dIdx) {
    setDays(d => d.map((day, i) => i !== dIdx ? day : {
      ...day,
      oefeningen: [...day.oefeningen, emptyOefening()]
    }));
  }

  function removeOefening(dIdx, oIdx) {
    setDays(d => d.map((day, i) => i !== dIdx ? day : {
      ...day,
      oefeningen: day.oefeningen.filter((_, j) => j !== oIdx)
    }));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name, description, days });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground">{schema ? 'Schema bewerken' : 'Nieuw schema'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-all">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Naam & beschrijving */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Schema naam *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="bijv. Push/Pull/Legs"
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Beschrijving</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Korte omschrijving van het schema"
                className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Dagen */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">Trainingsdagen</h3>
              <button
                onClick={addDay}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-border text-muted-foreground hover:text-foreground rounded-lg text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Dag toevoegen
              </button>
            </div>

            {days.map((day, dIdx) => (
              <div key={dIdx} className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3">
                {/* Dag naam */}
                <div className="flex items-center gap-2">
                  <input
                    value={day.dag_naam}
                    onChange={e => updateDay(dIdx, 'dag_naam', e.target.value)}
                    placeholder={`Dag ${dIdx + 1} – bijv. Push`}
                    className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {days.length > 1 && (
                    <button onClick={() => removeDay(dIdx)} className="p-2 hover:bg-destructive/20 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                </div>

                {/* Oefeningen header */}
                <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-1 gap-2">
                  <span className="col-span-4">Oefening</span>
                  <span className="col-span-2">Sets×Reps</span>
                  <span className="col-span-2">Rust</span>
                  <span className="col-span-3">Tip</span>
                  <span className="col-span-1"></span>
                </div>

                {/* Oefeningen */}
                {day.oefeningen.map((oe, oIdx) => (
                  <div key={oIdx} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={oe.naam}
                      onChange={e => updateOefening(dIdx, oIdx, 'naam', e.target.value)}
                      placeholder="Squat"
                      className="col-span-4 bg-input border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      value={oe.sets}
                      onChange={e => updateOefening(dIdx, oIdx, 'sets', e.target.value)}
                      placeholder="3x10"
                      className="col-span-2 bg-input border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center"
                    />
                    <input
                      value={oe.rust}
                      onChange={e => updateOefening(dIdx, oIdx, 'rust', e.target.value)}
                      placeholder="90s"
                      className="col-span-2 bg-input border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-center"
                    />
                    <input
                      value={oe.tip}
                      onChange={e => updateOefening(dIdx, oIdx, 'tip', e.target.value)}
                      placeholder="Optionele tip"
                      className="col-span-3 bg-input border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={() => removeOefening(dIdx, oIdx)}
                      disabled={day.oefeningen.length === 1}
                      className="col-span-1 p-1 hover:bg-destructive/20 rounded-lg transition-all disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addOefening(dIdx)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Oefening toevoegen
                </button>
              </div>
            ))}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Opslaan...' : 'Schema opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}