import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Utensils, Lock, ChevronDown, ChevronUp, Apple, Beef, Droplets } from 'lucide-react';
import AiMenuGenerator from '@/components/voeding/AiMenuGenerator';
import OrthoChat from '@/components/voeding/OrthoChat';

const FREE_PLANS = [
  {
    name: 'Standaard Cut Plan – 1800 kcal',
    goal_group: 'beginner',
    calories: 1800,
    protein_g: 160,
    carbs_g: 175,
    fat_g: 50,
    meals: [
      { meal_name: 'Ontbijt (07:00)', foods: [
        { name: 'Havermout', amount_g: 80, calories: 300, protein_g: 10, carbs_g: 55, fat_g: 5 },
        { name: 'Griekse yoghurt (0%)', amount_g: 200, calories: 120, protein_g: 20, carbs_g: 7, fat_g: 0 },
        { name: 'Banaan', amount_g: 120, calories: 100, protein_g: 1, carbs_g: 25, fat_g: 0 },
      ]},
      { meal_name: 'Lunch (12:30)', foods: [
        { name: 'Kipfilet (gegrild)', amount_g: 150, calories: 165, protein_g: 35, carbs_g: 0, fat_g: 2 },
        { name: 'Bruine rijst (gekookt)', amount_g: 150, calories: 175, protein_g: 4, carbs_g: 38, fat_g: 1 },
        { name: 'Broccoli (gestoomd)', amount_g: 200, calories: 70, protein_g: 6, carbs_g: 12, fat_g: 1 },
      ]},
      { meal_name: 'Pre-workout snack (16:00)', foods: [
        { name: 'Kwark', amount_g: 200, calories: 130, protein_g: 22, carbs_g: 9, fat_g: 0 },
        { name: 'Rijstwafels', amount_g: 40, calories: 150, protein_g: 3, carbs_g: 32, fat_g: 1 },
      ]},
      { meal_name: 'Avondeten (19:00)', foods: [
        { name: 'Zalm', amount_g: 150, calories: 280, protein_g: 34, carbs_g: 0, fat_g: 16 },
        { name: 'Zoete aardappel', amount_g: 200, calories: 170, protein_g: 4, carbs_g: 40, fat_g: 0 },
        { name: 'Spinazie + olijfolie', amount_g: 150, calories: 80, protein_g: 4, carbs_g: 3, fat_g: 5 },
      ]},
      { meal_name: 'Avondsnack (21:00)', foods: [
        { name: 'Cottage cheese', amount_g: 200, calories: 130, protein_g: 22, carbs_g: 6, fat_g: 2 },
      ]},
    ]
  },
  {
    name: 'Hoog-eiwit Plan – 2000 kcal',
    goal_group: 'gevorderd',
    calories: 2000,
    protein_g: 200,
    carbs_g: 160,
    fat_g: 55,
    meals: [
      { meal_name: 'Ontbijt (07:00)', foods: [
        { name: 'Eieren (3 stuks)', amount_g: 150, calories: 210, protein_g: 18, carbs_g: 1, fat_g: 15 },
        { name: 'Eiwitten (2 stuks)', amount_g: 66, calories: 34, protein_g: 7, carbs_g: 0, fat_g: 0 },
        { name: 'Volkorenbrood (2 sneetjes)', amount_g: 80, calories: 200, protein_g: 8, carbs_g: 36, fat_g: 2 },
      ]},
      { meal_name: 'Lunch (12:00)', foods: [
        { name: 'Tonijn (blik, op water)', amount_g: 200, calories: 180, protein_g: 40, carbs_g: 0, fat_g: 2 },
        { name: 'Pasta (gekookt)', amount_g: 180, calories: 250, protein_g: 9, carbs_g: 50, fat_g: 2 },
        { name: 'Groente + tomatensaus', amount_g: 200, calories: 80, protein_g: 4, carbs_g: 15, fat_g: 2 },
      ]},
      { meal_name: 'Post-workout (17:30)', foods: [
        { name: 'Whey proteïneshake', amount_g: 30, calories: 120, protein_g: 25, carbs_g: 5, fat_g: 1 },
        { name: 'Banaan', amount_g: 120, calories: 100, protein_g: 1, carbs_g: 25, fat_g: 0 },
      ]},
      { meal_name: 'Avondeten (19:30)', foods: [
        { name: 'Rundergehakt (5% vet)', amount_g: 200, calories: 280, protein_g: 42, carbs_g: 0, fat_g: 12 },
        { name: 'Aardappelen', amount_g: 250, calories: 200, protein_g: 5, carbs_g: 45, fat_g: 0 },
        { name: 'Salade + olijfolie (1 el)', amount_g: 100, calories: 80, protein_g: 2, carbs_g: 4, fat_g: 7 },
      ]},
      { meal_name: 'Caseine voor bed (22:00)', foods: [
        { name: 'Kwark', amount_g: 300, calories: 195, protein_g: 33, carbs_g: 13, fat_g: 0 },
      ]},
    ]
  },
];

const TOP_EIWITTEN = [
  { naam: 'Kipfilet', kcal: 110, eiwit: 23, koolh: 0, vet: 2 },
  { naam: 'Griekse yoghurt (0%)', kcal: 60, eiwit: 10, koolh: 3.5, vet: 0 },
  { naam: 'Kwark', kcal: 65, eiwit: 11, koolh: 3, vet: 0.1 },
  { naam: 'Eiwitten (rauw)', kcal: 52, eiwit: 11, koolh: 0.7, vet: 0.2 },
  { naam: 'Zalm', kcal: 183, eiwit: 22, koolh: 0, vet: 10 },
  { naam: 'Tonijn (blik water)', kcal: 90, eiwit: 20, koolh: 0, vet: 1 },
  { naam: 'Cottage cheese', kcal: 65, eiwit: 11, koolh: 3, vet: 1 },
  { naam: 'Rundergehakt (5%)', kcal: 140, eiwit: 21, koolh: 0, vet: 6 },
];

export default function Voeding() {
  const [profile, setProfile] = useState(null);
  const [openPlan, setOpenPlan] = useState(0);
  const [openMeal, setOpenMeal] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const u = await base44.auth.me();
    const profiles = await base44.entities.UserProfile.filter({ created_by: u.email });
    if (profiles.length > 0) setProfile(profiles[0]);
  }

  return (
    <div className="p-6 pb-24 md:pb-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Voedingsplan</h1>
        <p className="text-muted-foreground text-sm">Kant-en-klare maaltijdplannen op basis van je doelen</p>
      </div>

      {/* Doelen herinnering */}
      {profile && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Doel calorieën', value: `${profile.target_calories} kcal`, color: 'text-orange-400' },
            { label: 'Eiwit doel', value: `${profile.protein_target_g}g`, color: 'text-primary' },
            { label: 'Vetten doel', value: `${profile.fat_target_g}g`, color: 'text-accent' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`font-bold text-lg ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Menu Generator */}
      <AiMenuGenerator profile={profile} />

      {/* Gratis plannen */}
      <h2 className="font-semibold text-foreground mb-4">📋 Maaltijdplannen</h2>
      {FREE_PLANS.map((plan, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
          <button onClick={() => setOpenPlan(openPlan === i ? -1 : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-all">
            <div>
              <p className="font-semibold text-foreground">{plan.name}</p>
              <div className="flex gap-4 mt-1">
                <span className="text-xs text-orange-400">{plan.calories} kcal</span>
                <span className="text-xs text-primary">{plan.protein_g}g eiwit</span>
                <span className="text-xs text-blue-400">{plan.carbs_g}g koolh</span>
                <span className="text-xs text-accent">{plan.fat_g}g vet</span>
              </div>
            </div>
            {openPlan === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
          </button>

          {openPlan === i && (
            <div className="border-t border-border">
              {plan.meals.map((meal, j) => (
                <div key={j} className="border-b border-border last:border-0">
                  <button onClick={() => setOpenMeal(openMeal === `${i}-${j}` ? null : `${i}-${j}`)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Utensils className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{meal.meal_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{meal.foods.reduce((s, f) => s + f.calories, 0)} kcal</span>
                      {openMeal === `${i}-${j}` ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                    </div>
                  </button>
                  {openMeal === `${i}-${j}` && (
                    <div className="px-5 pb-4 space-y-2">
                      {meal.foods.map((food, k) => (
                        <div key={k} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                          <div>
                            <p className="text-sm font-medium text-foreground">{food.name}</p>
                            <p className="text-xs text-muted-foreground">{food.amount_g}g</p>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <span className="text-orange-400">{food.calories} kcal</span>
                            <span className="text-primary">{food.protein_g}g eiwit</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Top eiwitbronnen */}
      <h2 className="font-semibold text-foreground mb-4 mt-8">🥩 Top eiwitbronnen (per 100g)</h2>
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
        <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground p-4 pb-2 border-b border-border">
          <span>Product</span>
          <span className="text-center text-orange-400">Kcal</span>
          <span className="text-center text-primary">Eiwit</span>
          <span className="text-center text-blue-400">Koolh</span>
        </div>
        {TOP_EIWITTEN.map((item, i) => (
          <div key={i} className={`grid grid-cols-4 p-4 py-3 text-sm ${i % 2 === 0 ? 'bg-secondary/20' : ''}`}>
            <span className="font-medium text-foreground">{item.naam}</span>
            <span className="text-center text-muted-foreground">{item.kcal}</span>
            <span className="text-center text-primary font-medium">{item.eiwit}g</span>
            <span className="text-center text-muted-foreground">{item.koolh}g</span>
          </div>
        ))}
      </div>

      <OrthoChat />

      {/* Premium lock */}
      <div className="bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-6 text-center">
        <Lock className="w-8 h-8 text-accent mx-auto mb-3" />
        <h3 className="font-bold text-foreground mb-2">Premium Voedingsplannen</h3>
        <p className="text-sm text-muted-foreground mb-4">Krijg 20+ maaltijdplannen, recepten, boodschappenlijsten en macro-tracking direct in de app</p>
        <button className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium text-sm hover:bg-accent/90 transition-all">
          Upgrade naar Premium →
        </button>
      </div>
    </div>
  );
}