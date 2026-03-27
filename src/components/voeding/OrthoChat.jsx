import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, X, Loader2, Leaf, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

const SNELKEUZES = [
  'Wat mag ik nog eten vandaag?',
  'Geef me een gezond alternatief voor mijn avondmaaltijd',
  'Haal ik mijn eiwitdoel?',
  'Welke supplementen zijn aan te raden?',
  'Wat eet ik het beste na mijn training?',
];

export default function OrthoChat() {
  const [open, setOpen] = useState(false);
  const [berichten, setBerichten] = useState([
    { role: 'assistant', content: 'Hoi! Ik ben je orthomoleculaire voedingscoach 🌿 Ik heb toegang tot je profiel en daglog. Stel me een vraag over je macro\'s, eetschema of productvervangingen.' }
  ]);
  const [input, setInput] = useState('');
  const [laden, setLaden] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [berichten, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function stuurBericht(tekst) {
    const vraag = tekst || input.trim();
    if (!vraag || laden) return;
    setInput('');

    const nieuweBerichten = [...berichten, { role: 'user', content: vraag }];
    setBerichten(nieuweBerichten);
    setLaden(true);

    const res = await base44.functions.invoke('voedingsChat', {
      vraag,
      geschiedenis: berichten.slice(-6),
    });

    setBerichten([...nieuweBerichten, { role: 'assistant', content: res.data.antwoord }]);
    setLaden(false);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-5 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat venster */}
      {open && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-[400px] h-[90vh] md:h-[600px] bg-card border border-border md:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Ortho Voedingscoach</p>
                <p className="text-xs text-primary">Orthomoleculaire richtlijnen</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Berichten */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {berichten.map((b, i) => (
              <div key={i} className={`flex ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {b.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-1">
                    <Leaf className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  b.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary text-foreground rounded-bl-sm'
                }`}>
                  {b.role === 'assistant' ? (
                    <ReactMarkdown
                      className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                      components={{
                        p: ({ children }) => <p className="my-0.5 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                      }}
                    >{b.content}</ReactMarkdown>
                  ) : b.content}
                </div>
              </div>
            ))}
            {laden && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Leaf className="w-3 h-3 text-primary-foreground" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Snelkeuzes */}
          {berichten.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {SNELKEUZES.map((v, i) => (
                <button
                  key={i}
                  onClick={() => stuurBericht(v)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && stuurBericht()}
              placeholder="Stel een vraag over je voeding..."
              className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              disabled={laden}
            />
            <Button
              size="icon"
              onClick={() => stuurBericht()}
              disabled={!input.trim() || laden}
              className="shrink-0 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}