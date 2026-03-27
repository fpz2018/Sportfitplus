import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

const categoriekleur = {
  voeding: 'bg-orange-500/10 text-orange-600',
  training: 'bg-red-500/10 text-red-600',
  herstel: 'bg-blue-500/10 text-blue-600',
  supplementen: 'bg-green-500/10 text-green-600',
  hormonen: 'bg-purple-500/10 text-purple-600',
  overig: 'bg-slate-500/10 text-slate-600',
};

export default function Nieuws() {
  const [berichten, setBerichten] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    laadBerichten();
  }, []);

  async function laadBerichten() {
    setLoading(true);
    const alle = await base44.entities.Nieuwsbericht.filter({ status: 'gepubliceerd' }, '-gepubliceerd_op', 100);
    setBerichten(alle);
    setLoading(false);
  }

  const selected = berichten.find(b => b.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nieuws</h1>
        <p className="text-muted-foreground">Ontdek de nieuwste artikelen over fitness en voeding</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Artikel lijst */}
        <div className="md:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
          {berichten.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Geen artikelen beschikbaar</p>
            </div>
          ) : (
            berichten.map(bericht => (
              <button
                key={bericht.id}
                onClick={() => setSelectedId(bericht.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === bericht.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <Badge className={categoriekleur[bericht.categorie] || categoriekleur.overig} variant="secondary">
                    {bericht.categorie}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm text-foreground line-clamp-2">{bericht.titel}</h3>
                {bericht.gepubliceerd_op && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(bericht.gepubliceerd_op), 'd MMM yyyy', { locale: nl })}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Artikel detail */}
        <div className="md:col-span-2">
          {selected ? (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={categoriekleur[selected.categorie] || categoriekleur.overig}>
                    {selected.categorie}
                  </Badge>
                  {selected.gepubliceerd_op && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(selected.gepubliceerd_op), 'd MMMM yyyy', { locale: nl })}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">{selected.titel}</h1>
                {selected.intro && (
                  <p className="text-muted-foreground italic mb-4">{selected.intro}</p>
                )}
              </div>

              {selected.afbeelding_url && (
                <img
                  src={selected.afbeelding_url}
                  alt={selected.titel}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              {selected.inhoud && (
                <div className="text-foreground space-y-3 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h2 className="text-xl font-bold mt-4 mb-2">{children}</h2>,
                      h2: ({children}) => <h3 className="text-lg font-semibold mt-3 mb-2">{children}</h3>,
                      h3: ({children}) => <h4 className="font-semibold mt-2 mb-1">{children}</h4>,
                      p: ({children}) => <p className="text-foreground">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                      li: ({children}) => <li className="text-foreground">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                      em: ({children}) => <em className="italic">{children}</em>,
                      a: ({href, children}) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">{children}</blockquote>,
                    }}
                  >
                    {selected.inhoud}
                  </ReactMarkdown>
                </div>
              )}

              {selected.bron_pubmed_url && (
                <div className="pt-4 border-t border-border">
                  <a
                    href={selected.bron_pubmed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Origineel wetenschappelijk artikel →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-card border border-border rounded-lg text-muted-foreground">
              <p>Selecteer een artikel om te lezen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}