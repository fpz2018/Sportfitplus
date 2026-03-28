import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2, ShoppingCart, Clock } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import MaaltijdSlot from '@/components/weekmenu/MaaltijdSlot';
import ReceptKiezer from '@/components/weekmenu/ReceptKiezer';
import MacroSuggestie from '@/components/weekmenu/MacroSuggestie';
import Boodschappenlijst from '@/components/weekmenu/Boodschappenlijst';
import DayFoodLogEditor from '@/components/weekmenu/DayFoodLogEditor';
import FoodSearch from '@/components/voeding/FoodSearch';

const MAALTIJD_TYPES = ['ontbijt', 'lunch', 'diner', 'snack'];

function getWeekDays(baseDate) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function Weekmenu() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [geselecteerdeDag, setGeselecteerdeDag] = useState(new Date());
  const [geselecteerdeTab, setGeselecteerdeTab] = useState('planning');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kiezerOpen, setKiezerOpen] = useState(null); // maaltijd_type string
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [alleRecepten, setAlleRecepten] = useState([]);
  const [boodschappenOpen, setBoodschappenOpen] = useState(false);
  const [foodSearchType, setFoodSearchType] = useState(null); // maaltijd_type voor food search

  const weekDagen = getWeekDays(addDays(new Date(), weekOffset * 7));

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      laadItems(u);
      const [profielen, recepten] = await Promise.all([
        base44.entities.UserProfile.filter({ created_by: u.email }),
        base44.entities.Recipe.list('-created_date', 500),
      ]);
      if (profielen.length > 0) setProfile(profielen[0]);
      setAlleRecepten(recepten);
    });
  }, [weekOffset]);

  async function laadItems(u) {
    setLoading(true);
    const start = format(weekDagen[0], 'yyyy-MM-dd');
    const end = format(weekDagen[6], 'yyyy-MM-dd');
    const data = await base44.entities.WeekMenu.filter({ created_by: (u || user)?.email });
    // Filter op week
    const weekItems = data.filter(i => i.datum >= start && i.datum <= end);
    setItems(weekItems);
    setLoading(false);
  }

  function itemsVoorDag(dag) {
    const dagStr = format(dag, 'yyyy-MM-dd');
    return items.filter(i => i.datum === dagStr);
  }

  function itemsVoorType(dag, type) {
    const dagStr = format(dag, 'yyyy-MM-dd');
    return items.filter(i => i.datum === dagStr && i.maaltijd_type === type);
  }

  async function voegToe(recept, overrideType = null) {
    const type = overrideType || kiezerOpen;
    if (!type) return;
    const dagStr = format(geselecteerdeDag, 'yyyy-MM-dd');
    const nieuw = await base44.entities.WeekMenu.create({
      datum: dagStr,
      maaltijd_type: type,
      recept_id: recept.id,
      recept_titel: recept.title,
      recept_image_url: recept.image_url || null,
      calories: recept.calories_per_serving || null,
      protein_g: recept.protein_g || null,
      carbs_g: recept.carbs_g || null,
      fat_g: recept.fat_g || null,
    });
    setItems(prev => [...prev, nieuw]);
    setKiezerOpen(null);
  }

  async function verwijder(item) {
    await base44.entities.WeekMenu.delete(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  async function voegVoedingsmiddelToe(voedingsmiddel) {
    if (!foodSearchType) return;
    const dagStr = format(geselecteerdeDag, 'yyyy-MM-dd');
    const nieuw = await base44.entities.WeekMenu.create({
      datum: dagStr,
      maaltijd_type: foodSearchType,
      recept_titel: voedingsmiddel.name,
      calories: voedingsmiddel.calories,
      protein_g: voedingsmiddel.protein_g,
      carbs_g: voedingsmiddel.carbs_g,
      fat_g: voedingsmiddel.fat_g,
      recept_image_url: voedingsmiddel.image_url || null,
    });
    setItems(prev => [...prev, nieuw]);
    setFoodSearchType(null);
  }

  // Dagelijkse macrototalen
  function totalen(dag) {
    const dagItems = itemsVoorDag(dag);
    return dagItems.reduce((acc, i) => ({
      cal: acc.cal + (i.calories || 0),
      prot: acc.prot + (i.protein_g || 0),
      carbs: acc.carbs + (i.carbs_g || 0),
      fat: acc.fat + (i.fat_g || 0),
    }), { cal: 0, prot: 0, carbs: 0, fat: 0 });
  }

  const vandaag = new Date();

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weekmenu</h1>
          <p className="text-muted-foreground text-sm">Plan je maaltijden voor de hele week</p>
        </div>
        <button onClick={() => setBoodschappenOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Boodschappen</span>
        </button>
      </div>

      {/* Week navigatie */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset(w => w - 1)}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-foreground text-sm">
            {format(weekDagen[0], 'd MMM', { locale: nl })} – {format(weekDagen[6], 'd MMM yyyy', { locale: nl })}
          </p>
          {weekOffset === 0 && <p className="text-xs text-primary">Huidige week</p>}
          {weekOffset === 1 && <p className="text-xs text-muted-foreground">Volgende week</p>}
          {weekOffset === -1 && <p className="text-xs text-muted-foreground">Vorige week</p>}
        </div>
        <button onClick={() => setWeekOffset(w => w + 1)}
          className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dag tabs */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDagen.map(dag => {
          const isVandaag = isSameDay(dag, vandaag);
          const isGekozen = isSameDay(dag, geselecteerdeDag);
          const dagItems = itemsVoorDag(dag);
          return (
            <button key={dag.toISOString()} onClick={() => setGeselecteerdeDag(dag)}
              className={`flex flex-col items-center py-2.5 px-1 rounded-xl border transition-all ${isGekozen ? 'border-primary bg-primary/10' : isVandaag ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/30'}`}>
              <span className="text-xs text-muted-foreground">
                {format(dag, 'EEE', { locale: nl }).slice(0, 2)}
              </span>
              <span className={`text-sm font-bold mt-0.5 ${isGekozen ? 'text-primary' : isVandaag ? 'text-primary/70' : 'text-foreground'}`}>
                {format(dag, 'd')}
              </span>
              {dagItems.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dagItems.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-primary" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Macro overzicht voor geselecteerde dag */}
      {profile && (() => {
        const t = totalen(geselecteerdeDag);
        const doelen = [
          { label: 'Calorieën', gegeten: t.cal, doel: profile.target_calories, kleur: 'bg-orange-400', unit: 'kcal' },
          { label: 'Eiwit', gegeten: t.prot, doel: profile.protein_target_g, kleur: 'bg-primary', unit: 'g' },
          { label: 'Koolhydraten', gegeten: t.carbs, doel: profile.carbs_target_g, kleur: 'bg-blue-400', unit: 'g' },
          { label: 'Vetten', gegeten: t.fat, doel: profile.fat_target_g, kleur: 'bg-accent', unit: 'g' },
        ].filter(d => d.doel);
        if (doelen.length === 0) return null;
        return (
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Macro's vandaag</p>
            {doelen.map(({ label, gegeten, doel, kleur, unit }) => {
              const pct = Math.min((gegeten / doel) * 100, 100);
              const resterend = Math.max(doel - gegeten, 0);
              const over = gegeten > doel;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={over ? 'text-destructive font-medium' : 'text-foreground'}>
                      {gegeten > 0 ? <>{gegeten} / {doel} {unit}</> : <span className="text-muted-foreground">{resterend} {unit} resterend</span>}
                      {over && <span className="text-destructive ml-1">(+{gegeten - doel})</span>}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${over ? 'bg-destructive' : kleur} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Tabs: Planning / Log indienen */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setGeselecteerdeTab('planning')}
          className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all ${
            geselecteerdeTab === 'planning' 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border text-muted-foreground hover:border-primary/40'
          }`}
        >
          Planning
        </button>
        <button 
          onClick={() => setGeselecteerdeTab('log')}
          className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            geselecteerdeTab === 'log' 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border text-muted-foreground hover:border-primary/40'
          }`}
        >
          <Clock className="w-4 h-4" /> Indienen
        </button>
      </div>

      {/* Dag detail */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : geselecteerdeTab === 'planning' ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground capitalize">
                {format(geselecteerdeDag, 'EEEE d MMMM', { locale: nl })}
              </p>
              {(() => {
                const t = totalen(geselecteerdeDag);
                return t.cal > 0 ? (
                  <p className="text-xs text-muted-foreground">{t.cal} kcal · {t.prot}g eiwit gepland</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Nog niets ingepland</p>
                );
              })()}
            </div>
          </div>
          <div className="p-4">
            {MAALTIJD_TYPES.map(type => (
              <MaaltijdSlot
                key={type}
                type={type}
                items={itemsVoorType(geselecteerdeDag, type)}
                onAdd={(t) => setKiezerOpen(t)}
                onRemove={verwijder}
                onOpenFoodSearch={(t) => setFoodSearchType(t)}
              />
            ))}
            {profile && alleRecepten.length > 0 && (() => {
              const t = totalen(geselecteerdeDag);
              const resterend = {
                cal: Math.max((profile.target_calories || 0) - t.cal, 0),
                prot: Math.max((profile.protein_target_g || 0) - t.prot, 0),
                carbs: Math.max((profile.carbs_target_g || 0) - t.carbs, 0),
                fat: Math.max((profile.fat_target_g || 0) - t.fat, 0),
              };
              const geplandTypes = itemsVoorDag(geselecteerdeDag).map(i => i.maaltijd_type);
              return (
                <MacroSuggestie
                  resterend={resterend}
                  recepten={alleRecepten}
                  geselecteerdeDag={geselecteerdeDag}
                  maaltijdTypes={geplandTypes}
                  onVoegToe={(recept, type) => voegToe(recept, type)}
                />
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4">
          <DayFoodLogEditor
            date={geselecteerdeDag}
            weekMenuItems={itemsVoorDag(geselecteerdeDag)}
            profile={profile}
            onSaved={() => laadItems(user)}
          />
        </div>
      )}

      {boodschappenOpen && (
        <Boodschappenlijst
          alleRecepten={alleRecepten}
          onSluit={() => setBoodschappenOpen(false)}
        />
      )}

      {kiezerOpen && (
        <ReceptKiezer
          maaltijdType={kiezerOpen}
          onKies={voegToe}
          onSluit={() => setKiezerOpen(null)}
        />
      )}

      {foodSearchType && (
        <FoodSearch
          onSelect={voegVoedingsmiddelToe}
          onClose={() => setFoodSearchType(null)}
        />
      )}
    </div>
  );
}