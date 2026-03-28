import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X, QrCode, ChevronLeft, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';

const UNIT_DEFAULTS = {
  'banaan': { unit: 'stuk', defaultQty: 1 },
  'ei': { unit: 'stuk', defaultQty: 1 },
  'appel': { unit: 'stuk', defaultQty: 1 },
  'sinaasappel': { unit: 'stuk', defaultQty: 1 },
  'tomaat': { unit: 'stuk', defaultQty: 1 },
  'rijst': { unit: 'g', defaultQty: 100 },
  'pasta': { unit: 'g', defaultQty: 100 },
  'brood': { unit: 'g', defaultQty: 50 },
  'melk': { unit: 'ml', defaultQty: 200 },
  'yoghurt': { unit: 'g', defaultQty: 125 },
  'havermout': { unit: 'g', defaultQty: 50 },
  'kip': { unit: 'g', defaultQty: 150 },
  'vis': { unit: 'g', defaultQty: 150 },
};

function guessUnit(productName) {
  const name = productName.toLowerCase();
  for (const [key, { unit, defaultQty }] of Object.entries(UNIT_DEFAULTS)) {
    if (name.includes(key)) {
      return { unit, defaultQty };
    }
  }
  // Default to grams
  return { unit: 'g', defaultQty: 100 };
}

export default function FoodSearchWithQuantity({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('g');
  
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
        () => {}
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
    
    const res = await base44.functions.invoke('searchOpenFoodFacts', { query });
    setResults(res.data.products || []);
    setLoading(false);
  }

  async function handleBarcodeScan(barcode) {
    setLoading(true);
    setSearched(true);
    
    const res = await base44.functions.invoke('searchOpenFoodFacts', { barcode });
    setResults(res.data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    if (query.trim().length > 1) {
      handleSearch();
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  function handleSelectProduct(product) {
    const { unit: guessedUnit, defaultQty } = guessUnit(product.name);
    setSelectedProduct(product);
    setUnit(guessedUnit);
    setQuantity(defaultQty);
  }

  function handleConfirm() {
    if (!selectedProduct) return;
    
    // Bereken macros op basis van hoeveelheid
    // Standaard zijn macros per 100g/ml/stuk
    const multiplier = guessUnit(selectedProduct.name).unit === selectedProduct.name.includes('stuk') 
      ? quantity 
      : quantity / 100;

    onSelect({
      name: selectedProduct.name,
      calories: selectedProduct.calories * multiplier,
      protein_g: selectedProduct.protein_g * multiplier,
      carbs_g: selectedProduct.carbs_g * multiplier,
      fat_g: selectedProduct.fat_g * multiplier,
      image_url: selectedProduct.image_url,
      brand: selectedProduct.brands,
      quantity,
      quantity_unit: unit,
      original_product: selectedProduct
    });
    onClose();
  }

  // Quantity selector screen
  if (selectedProduct) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
        <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col border border-border">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <button onClick={() => setSelectedProduct(null)} 
              className="p-1 rounded-lg hover:bg-secondary transition-all">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="font-semibold text-foreground flex-1 text-center">Hoeveelheid</h2>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-all">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Product preview */}
          <div className="p-6 border-b border-border flex gap-4 items-start">
            {selectedProduct.image_url && (
              <img src={selectedProduct.image_url} alt={selectedProduct.name} 
                className="w-20 h-20 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-foreground">{selectedProduct.name}</p>
              {selectedProduct.brands && (
                <p className="text-xs text-muted-foreground">{selectedProduct.brands}</p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round(selectedProduct.calories)} kcal · {selectedProduct.protein_g}g eiwit per 100{unit === 'stuk' ? ' stuks' : unit}
              </p>
            </div>
          </div>

          {/* Quantity input */}
          <div className="p-6 flex-1 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-6">Hoeveel {unit === 'stuk' ? 'stuks' : unit}?</p>
            
            <div className="flex items-center gap-4 mb-10">
              <button onClick={() => setQuantity(Math.max(0.5, quantity - (unit === 'stuk' ? 1 : 10)))}
                className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all">
                <Minus className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0.5, parseFloat(e.target.value) || 0))}
                className="w-20 text-center text-2xl font-bold px-3 py-2 rounded-xl border border-border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              <button onClick={() => setQuantity(quantity + (unit === 'stuk' ? 1 : 10))}
                className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Unit selector */}
            <div className="w-full space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Eenheid</p>
              <div className="grid grid-cols-4 gap-2">
                {['stuk', 'g', 'ml', 'liter'].map(u => (
                  <button
                    key={u}
                    onClick={() => {
                      setUnit(u);
                      if (u === 'stuk' && unit !== 'stuk') setQuantity(1);
                    }}
                    className={`py-2.5 rounded-lg border font-medium text-sm transition-all ${
                      unit === u
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Macro preview */}
            <div className="mt-8 w-full bg-secondary/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Deze hoeveelheid:</p>
              <p className="text-sm font-medium text-foreground">
                {Math.round(selectedProduct.calories * (unit === 'stuk' ? quantity : quantity / 100))} kcal
                · {(selectedProduct.protein_g * (unit === 'stuk' ? quantity : quantity / 100)).toFixed(1)}g eiwit
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 border-t border-border flex gap-2 shrink-0">
            <button onClick={() => setSelectedProduct(null)}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground hover:border-primary/40 transition-all font-medium">
              Terug
            </button>
            <button onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Toevoegen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Search screen
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
              <div className="w-6 h-6 border-4 border-muted-foreground border-t-primary rounded-full animate-spin"></div>
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
                  onClick={() => handleSelectProduct(product)}
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