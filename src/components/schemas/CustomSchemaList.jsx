import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Dumbbell, ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import CustomSchemaEditor from './CustomSchemaEditor';
import WorkoutLogger from './WorkoutLogger';

export default function CustomSchemaList() {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSchema, setEditingSchema] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [openSchema, setOpenSchema] = useState(null);
  const [openDag, setOpenDag] = useState(null);
  const [loggerDag, setLoggerDag] = useState(null);

  useEffect(() => { loadSchemas(); }, []);

  async function loadSchemas() {
    const u = await base44.auth.me();
    const data = await base44.entities.CustomSchema.filter({ created_by: u.email }, '-created_date');
    setSchemas(data);
    setLoading(false);
  }

  async function handleSave(data) {
    if (editingSchema) {
      await base44.entities.CustomSchema.update(editingSchema.id, data);
    } else {
      await base44.entities.CustomSchema.create(data);
    }
    setShowEditor(false);
    setEditingSchema(null);
    loadSchemas();
  }

  async function handleDelete(schema) {
    if (!confirm(`Schema "${schema.name}" verwijderen?`)) return;
    await base44.entities.CustomSchema.delete(schema.id);
    loadSchemas();
  }

  function openEdit(schema) {
    setEditingSchema(schema);
    setShowEditor(true);
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Mijn schema's</h2>
        <button
          onClick={() => { setEditingSchema(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Nieuw schema
        </button>
      </div>

      {schemas.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Je hebt nog geen eigen schema's aangemaakt.</p>
          <button
            onClick={() => { setEditingSchema(null); setShowEditor(true); }}
            className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all"
          >
            Eerste schema aanmaken
          </button>
        </div>
      )}

      <div className="space-y-3">
        {schemas.map(schema => (
          <div key={schema.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Schema header */}
            <div className="flex items-center justify-between p-4">
              <button
                className="flex items-center gap-3 flex-1 text-left"
                onClick={() => setOpenSchema(openSchema === schema.id ? null : schema.id)}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{schema.name}</p>
                  {schema.description && (
                    <p className="text-xs text-muted-foreground">{schema.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{schema.days?.length || 0} dag(en)</p>
                </div>
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(schema)} className="p-2 hover:bg-secondary rounded-lg transition-all">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(schema)} className="p-2 hover:bg-destructive/10 rounded-lg transition-all">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
                {openSchema === schema.id
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
              </div>
            </div>

            {/* Dagen */}
            {openSchema === schema.id && schema.days?.map((dag, dIdx) => (
              <div key={dIdx} className="border-t border-border">
                <button
                  onClick={() => setOpenDag(openDag === `${schema.id}-${dIdx}` ? null : `${schema.id}-${dIdx}`)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-all"
                >
                  <span className="text-sm font-medium text-foreground">{dag.dag_naam || `Dag ${dIdx + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); setLoggerDag({ dag, schemaName: schema.name }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start
                    </button>
                    {openDag === `${schema.id}-${dIdx}`
                      ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </button>

                {openDag === `${schema.id}-${dIdx}` && dag.oefeningen?.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground mb-2 px-1">
                      <span>Oefening</span>
                      <span className="text-center">Sets × Reps</span>
                      <span className="text-center">Rust</span>
                      <span>Tip</span>
                    </div>
                    {dag.oefeningen.map((oe, oIdx) => (
                      <div key={oIdx} className={`grid grid-cols-4 gap-2 p-2 rounded-lg text-sm ${oIdx % 2 === 0 ? 'bg-secondary/30' : ''}`}>
                        <span className="font-medium text-foreground text-xs">{oe.naam}</span>
                        <span className="text-center text-primary font-mono text-xs">{oe.sets}</span>
                        <span className="text-center text-muted-foreground text-xs">{oe.rust}</span>
                        <span className="text-muted-foreground text-xs">{oe.tip}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {showEditor && (
        <CustomSchemaEditor
          schema={editingSchema}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingSchema(null); }}
        />
      )}

      {loggerDag && (
        <WorkoutLogger
          schemaName={loggerDag.schemaName}
          dag={loggerDag.dag.dag_naam}
          oefeningen={loggerDag.dag.oefeningen}
          onClose={() => setLoggerDag(null)}
        />
      )}
    </div>
  );
}