export const translations = {
  nl: {
    // Navigation
    dashboard: 'Dashboard',
    calculator: 'TDEE Calculator',
    trainingsSchemas: 'Trainingsschema\'s',
    voeding: 'Voeding',
    recepten: 'Recepten',
    weekmenu: 'Weekmenu',
    voortgang: 'Voortgang',
    mijnVoortgang: 'Mijn Voortgang',
    gids: 'Droog Gids',
    profiel: 'Profiel',
    nieuws: 'Nieuws',
    literatuurmonitor: 'Literatuurmonitor',
    inhoudsvoorstellen: 'Inhoudsvoorstellen',
    bronbeheer: 'Bronbeheer',
    coachAnalytics: 'Coach Analytics',
    nieuwsbeheer: 'Nieuwsbeheer',
    receptenBeheer: 'Recepten beheer',
    upgradePremium: 'Upgrade naar Premium',
    kennissysteem: 'Kennissysteem',

    // Common
    loading: 'Laden...',
    error: 'Er is een fout opgetreden',
    cancel: 'Annuleren',
    save: 'Opslaan',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    create: 'Aanmaken',
    search: 'Zoeken',
    filter: 'Filteren',
    close: 'Sluiten',
    back: 'Terug',
    next: 'Volgende',
    previous: 'Vorige',
    confirm: 'Bevestigen',
    yes: 'Ja',
    no: 'Nee',

    // Dashboard
    welkom: 'Welkom',
    vandaag: 'Vandaag',
    calorieën: 'Calorieën',
    proteïne: 'Proteïne',
    tdee: 'TDEE',
    gewicht: 'Gewicht',

    // Settings
    taal: 'Taal',
    nederlands: 'Nederlands',
    english: 'English',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    calculator: 'TDEE Calculator',
    trainingsSchemas: 'Training Schemas',
    voeding: 'Nutrition',
    recepten: 'Recipes',
    weekmenu: 'Week Menu',
    voortgang: 'Progress',
    mijnVoortgang: 'My Progress',
    gids: 'Dry Guide',
    profiel: 'Profile',
    nieuws: 'News',
    literatuurmonitor: 'Literature Monitor',
    inhoudsvoorstellen: 'Content Suggestions',
    bronbeheer: 'Source Management',
    coachAnalytics: 'Coach Analytics',
    nieuwsbeheer: 'News Management',
    receptenBeheer: 'Recipe Management',
    upgradePremium: 'Upgrade to Premium',
    kennissysteem: 'Knowledge System',

    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',

    // Dashboard
    welkom: 'Welcome',
    vandaag: 'Today',
    calorieën: 'Calories',
    proteïne: 'Protein',
    tdee: 'TDEE',
    gewicht: 'Weight',

    // Settings
    taal: 'Language',
    nederlands: 'Nederlands',
    english: 'English',
  }
};

export const getTranslation = (lang, key) => {
  return translations[lang]?.[key] || translations.nl[key] || key;
};