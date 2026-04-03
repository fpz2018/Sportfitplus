import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding.jsx';
import Calculator from './pages/Calculator';
import Voortgang from './pages/Voortgang';
import Schemas from './pages/Schemas';
import AppLayout from './components/layout/AppLayout';
import Voeding from './pages/Voeding';
import Gids from './pages/Gids';
import Profiel from './pages/Profiel';
import Recepten from './pages/Recepten';
import KennisMonitor from './pages/KennisMonitor';
import InhoudsVoorstellen from './pages/InhoudsVoorstellen';
import BronBeheer from './pages/BronBeheer';
import ReceptenBeheer from './pages/ReceptenBeheer';
import Weekmenu from './pages/Weekmenu';
import Nieuwsbeheer from './pages/Nieuwsbeheer';
import Nieuws from './pages/Nieuws';
import MijnVoortgang from './pages/MijnVoortgang';
import CoachAnalytics from './pages/CoachAnalytics';
import Supplementen from './pages/Supplementen';
import SupplementenBeheer from './pages/SupplementenBeheer';
import KennisUpdate from './pages/KennisUpdate';
import Welzijn from './pages/Welzijn';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Premium from './pages/Premium';
import MijnVoedingsmiddelen from './pages/MijnVoedingsmiddelen';
import Admin from './pages/Admin';

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/admin"   element={<Admin />} />
        <Route path="*"        element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/premium" element={<Premium />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"                  element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
        <Route path="/calculator"        element={<ErrorBoundary><Calculator /></ErrorBoundary>} />
        <Route path="/voortgang"         element={<ErrorBoundary><Voortgang /></ErrorBoundary>} />
        <Route path="/schemas"           element={<ErrorBoundary><Schemas /></ErrorBoundary>} />
        <Route path="/voeding"           element={<ErrorBoundary><Voeding /></ErrorBoundary>} />
        <Route path="/gids"              element={<ErrorBoundary><Gids /></ErrorBoundary>} />
        <Route path="/profiel"           element={<ErrorBoundary><Profiel /></ErrorBoundary>} />
        <Route path="/recepten"          element={<ErrorBoundary><Recepten /></ErrorBoundary>} />
        <Route path="/kennis"            element={<ErrorBoundary><KennisMonitor /></ErrorBoundary>} />
        <Route path="/voorstellen"       element={<ErrorBoundary><InhoudsVoorstellen /></ErrorBoundary>} />
        <Route path="/bronnen"           element={<ErrorBoundary><BronBeheer /></ErrorBoundary>} />
        <Route path="/recepten-beheer"   element={<ErrorBoundary><ReceptenBeheer /></ErrorBoundary>} />
        <Route path="/weekmenu"          element={<ErrorBoundary><Weekmenu /></ErrorBoundary>} />
        <Route path="/nieuws"            element={<ErrorBoundary><Nieuws /></ErrorBoundary>} />
        <Route path="/mijn-voortgang"    element={<ErrorBoundary><MijnVoortgang /></ErrorBoundary>} />
        <Route path="/coach-analytics"   element={<ErrorBoundary><CoachAnalytics /></ErrorBoundary>} />
        <Route path="/nieuwsbeheer"      element={<ErrorBoundary><Nieuwsbeheer /></ErrorBoundary>} />
        <Route path="/supplementen"      element={<ErrorBoundary><Supplementen /></ErrorBoundary>} />
        <Route path="/supplementen-beheer" element={<ErrorBoundary><SupplementenBeheer /></ErrorBoundary>} />
        <Route path="/kennis-update"     element={<ErrorBoundary><KennisUpdate /></ErrorBoundary>} />
        <Route path="/welzijn"           element={<ErrorBoundary><Welzijn /></ErrorBoundary>} />
        <Route path="/voedingsmiddelen"  element={<ErrorBoundary><MijnVoedingsmiddelen /></ErrorBoundary>} />
      </Route>
      <Route path="/onboarding" element={<ErrorBoundary><Onboarding /></ErrorBoundary>} />
      <Route path="/admin"      element={<Admin />} />
      <Route path="/landing"    element={<Landing />} />
      <Route path="/premium"    element={<Premium />} />
      <Route path="*"           element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
