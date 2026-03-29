import { useState, useEffect, useRef } from 'react';
import { callFunction } from '@/api/netlifyClient';
import { Search, Loader2, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function FoodSearch({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const scannerRef = useRef(null);
  const htmlScannerRef = useRef(null);

  useEffect(() => {
    if (scannerActive && scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'barcode-scanner',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          setScannerActive(false);
          scanner.clear();
          handleBarcodeScan(decodedText);
        },
        (error) => {
          // Ignore errors during scanning
        }
      );

      htmlScannerRef.current = scanner;
    }

    return () => {
      if (htmlScannerRef.current) {
        htmlScannerRef.current.clear().catch(() => {});
      }
    };
  }, [scannerActive]);

  async function handleSearch() {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    
    const res = await callFunction('searchOpenFoodFacts', { query });
    setResults(res?.products || []);
    setLoading(false);
  }

  // Autocomplete: search as you type
  useEffect(() => {
    if (query.trim().length > 1) {
      handleSearch();
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  async function handleBarcodeScan(barcode) {
    setLoading(true);
    setSearched(true);
    
    const res = await callFunction('searchOpenFoodFacts', { barcode });
    setResults(res?.products || []);
    setLoading(false);
  }

  function handleSelect(product) {
    onSelect({
      name: product.name,
      calories: product.calories,
      protein_g: product.protein_g,
      carbs_g: product.carbs_g,
      fat_g: product.fat_g,
      image_url: product.image_url,
      brand: product.brands
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-border">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="font-semibold text-foreground">Voedingsmiddel zoeken</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-all">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search input */}
        {!scannerActive && (
          <div className="p-4 border-b border-border shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Typ (bijv. BAN voor banaan)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button onClick={() => setScannerActive(true)} variant="outline" className="gap-2">
                <QrCode className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {scannerActive && (
          <div className="p-4 border-b border-border shrink-0 flex gap-2">
            <Button onClick={() => setScannerActive(false)} variant="outline" className="flex-1">
              Terug
            </Button>
          </div>
        )}

        {/* Barcode Scanner */}
        {scannerActive && (
          <div className="p-4 flex-1 overflow-y-auto">
            <div ref={scannerRef} id="barcode-scanner" className="w-full"></div>
          </div>
        )}

        {/* Results */}
        {!scannerActive && (
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : searched && results.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-sm text-muted-foreground">Geen resultaten gevonden</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-sm text-muted-foreground">Voer een zoekterm in</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-all text-left"
                >
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{product.name}</p>
                    {product.brands && <p className="text-xs text-muted-foreground">{product.brands}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.calories} kcal · {product.protein_g}g P · {product.carbs_g}g K · {product.fat_g}g V
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}