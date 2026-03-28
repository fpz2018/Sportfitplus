import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Edit2, Trash2, Loader2, Save, X, Upload, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function MijnVoedingsmiddelen() {
  const [zoek, setZoek] = useState('');
  const [categorie, setCategorie] = useState('all');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [toevoegForm, setToevoegForm] = useState(false);
  const [nieuwItem, setNieuwItem] = useState({
    name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    category: 'overig',
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);

  const { data: voedingsmiddelen = [], isLoading, refetch } = useQuery({
    queryKey: ['voedingsmiddelen'],
    queryFn: () => base44.entities.Food.list('-created_date', 500),
  });

  // Sync initial foods
  useEffect(() => {
    if (voedingsmiddelen.length === 0 && !isLoading) {
      base44.functions.invoke('syncFoodDatabase', {}).then(() => refetch());
    }
  }, []);

  const gefilterd = voedingsmiddelen.filter(v => {
    const matchZoek = v.name.toLowerCase().includes(zoek.toLowerCase());
    const matchCategorie = categorie === 'all' || v.category === categorie;
    return matchZoek && matchCategorie;
  });

  async function verwijder(id) {
    try {
      await base44.entities.Food.delete(id);
      refetch();
    } catch (error) {
      setImportError('Voedingsmiddel kon niet worden verwijderd');
      refetch();
    }
  }

  async function updateItem(id) {
    await base44.entities.Food.update(id, editData);
    setEditId(null);
    refetch();
  }

  async function voegToe() {
    const data = {
      ...nieuwItem,
      calories: parseFloat(nieuwItem.calories),
      protein_g: parseFloat(nieuwItem.protein_g),
      carbs_g: parseFloat(nieuwItem.carbs_g),
      fat_g: parseFloat(nieuwItem.fat_g),
    };
    await base44.entities.Food.create(data);
    setNieuwItem({ name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', category: 'overig' });
    setToevoegForm(false);
    refetch();
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      // Upload file to get URL
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;

      // Call import function with file URL instead of raw content
      const res = await base44.functions.invoke('importFoods', { file_url: fileUrl });
      
      if (res.data?.success) {
        setImportSuccess(`${res.data.imported} voedingsmiddelen geïmporteerd!`);
        refetch();
        e.target.value = '';
      } else {
        setImportError(res.data?.error || 'Import mislukt');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message || 'Import mislukt');
    } finally {
      setImportLoading(false);
    }
  }

  function downloadTemplate() {
    const headers = ['name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'category', 'brand'];
    const rows = [
      headers.join(','),
      'Banaan,89,1.1,23,0.3,2.6,fruit,',
      'Kip (borst),165,31,0,3.6,0,vlees,',
      'Rijst (wit),130,2.7,28,0.3,0.4,graan,',
    ];
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voedingsmiddelen_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mijn Voedingsmiddelen</h1>
          <p className="text-muted-foreground text-sm">{voedingsmiddelen.length} items • Beheer je voedingsmiddelendatabase</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (window.confirm('Weet je zeker? Dit verwijdert ALLES. Dit kan LANG duren (veel items = veel tijd).')) {
                setImportLoading(true);
                setImportSuccess(null);
                try {
                  await base44.functions.invoke('clearFoods', {});
                  setImportSuccess('Alle voedingsmiddelen verwijderd!');
                  // Refresh after short delay to ensure server is updated
                  setTimeout(() => refetch(), 1000);
                } catch (error) {
                  setImportError('Verwijderen mislukt: ' + error.message);
                } finally {
                  setImportLoading(false);
                }
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 transition-all text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Alles wissen
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm font-medium cursor-pointer">
            <Upload className="w-4 h-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={importLoading}
              className="hidden"
              key={importLoading ? 'reset' : 'normal'}
            />
          </label>
          <button
            onClick={() => setToevoegForm(!toevoegForm)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Toevoegen
          </button>
        </div>
      </div>

      {/* Import feedback */}
      {importSuccess && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 flex items-start justify-between">
          <p className="text-sm text-green-600">{importSuccess}</p>
          <button onClick={() => setImportSuccess(null)} className="text-green-600 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {importError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 mb-4 flex items-start justify-between">
          <p className="text-sm text-destructive">{importError}</p>
          <button onClick={() => setImportError(null)} className="text-destructive hover:text-destructive/70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nieuw item form */}
      {toevoegForm && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6">
          <p className="font-semibold text-foreground mb-4">Nieuw voedingsmiddel</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <input
              type="text"
              placeholder="Naam"
              value={nieuwItem.name}
              onChange={(e) => setNieuwItem({ ...nieuwItem, name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={nieuwItem.category}
              onChange={(e) => setNieuwItem({ ...nieuwItem, category: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {['groenten', 'fruit', 'vlees', 'vis', 'zuivel', 'graan', 'noten', 'olie', 'sauzen', 'overig'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Calorieën"
              value={nieuwItem.calories}
              onChange={(e) => setNieuwItem({ ...nieuwItem, calories: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input type="number" placeholder="Eiwit (g)" value={nieuwItem.protein_g} onChange={(e) => setNieuwItem({ ...nieuwItem, protein_g: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="Koolh (g)" value={nieuwItem.carbs_g} onChange={(e) => setNieuwItem({ ...nieuwItem, carbs_g: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="number" placeholder="Vet (g)" value={nieuwItem.fat_g} onChange={(e) => setNieuwItem({ ...nieuwItem, fat_g: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={voegToe} disabled={!nieuwItem.name} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50">
              Opslaan
            </button>
          </div>
          <button onClick={() => setToevoegForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
            Annuleren
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Zoeken..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">Alle categorieën</option>
          {['groenten', 'fruit', 'vlees', 'vis', 'zuivel', 'graan', 'noten', 'olie', 'sauzen', 'overig'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tabel */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/30">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Naam</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Kcal</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Eiwit</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Koolh</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Vet</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Categorie</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {gefilterd.map(item => (
                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                  {editId === item.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-input border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editData.calories}
                          onChange={(e) => setEditData({ ...editData, calories: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 rounded bg-input border border-border text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editData.protein_g}
                          onChange={(e) => setEditData({ ...editData, protein_g: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 rounded bg-input border border-border text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editData.carbs_g}
                          onChange={(e) => setEditData({ ...editData, carbs_g: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 rounded bg-input border border-border text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editData.fat_g}
                          onChange={(e) => setEditData({ ...editData, fat_g: parseFloat(e.target.value) })}
                          className="w-full px-2 py-1 rounded bg-input border border-border text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editData.category}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-input border border-border text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {['groenten', 'fruit', 'vlees', 'vis', 'zuivel', 'graan', 'noten', 'olie', 'sauzen', 'overig'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => updateItem(item.id)}
                          className="p-1 rounded hover:bg-primary/10 text-primary transition-all"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{Math.round(item.calories)}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.protein_g}g</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.carbs_g}g</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.fat_g}g</td>
                      <td className="px-4 py-3 text-center text-muted-foreground capitalize">{item.category}</td>
                      <td className="px-4 py-3 text-center flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setEditId(item.id);
                            setEditData(item);
                          }}
                          className="p-1 rounded hover:bg-primary/10 text-primary transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => verwijder(item.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}