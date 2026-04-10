import { Suspense, lazy } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';

// Lazy-loaded pages — elk wordt een apart chunk
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));
const Calculator = lazy(() => import('./pages/Calculator'));
const Voortgang = lazy(() => import('./pages/Voortgang'));
const Schemas = lazy(() => import('./pages/Schemas'));
const Voeding = lazy(() => import('./pages/Voeding'));
const Gids = lazy(() => import('./pages/Gids'));
const Profiel = lazy(() => import('./pages/Profiel'));
const Recepten = lazy(() => import('./pages/Recepten'));
const KennisMonitor = lazy(() => import('./pages/KennisMonitor'));
const InhoudsVoorstellen = lazy(() => import('./pages/InhoudsVoorstellen'));
const BronBeheer = lazy(() => import('./pages/BronBeheer'));
const ReceptenBeheer = lazy(() => import('./pages/ReceptenBeheer'));
const Weekmenu = lazy(() => import('./pages/Weekmenu'));
const Nieuwsbeheer = lazy(() => import('./pages/Nieuwsbeheer'));
const Nieuws = lazy(() => import('./pages/Nieuws'));
const MijnVoortgang = lazy(() => import('./pages/MijnVoortgang'));
const CoachAnalytics = lazy(() => import('./pages/CoachAnalytics'));
const Supplementen = lazy(() => import('./pages/Supplementen'));
const SupplementenBeheer = lazy(() => import('./pages/SupplementenBeheer'));
const KennisUpdate = lazy(() => import('./pages/KennisUpdate'));
const Welzijn = lazy(() => import('./pages/Welzijn'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Premium = lazy(() => import('./pages/Premium'));
const MijnVoedingsmiddelen = lazy(() => import('./pages/MijnVoedingsmiddelen'));
const Admin = lazy(() => import('./pages/Admin'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const PageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

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
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/admin"          element={<Admin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*"               element={<Landing />} />
          <Route path="/landing"        element={<Landing />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/premium"        element={<Premium />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageSpinner />}>
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
        <Route path="/onboarding"     element={<ErrorBoundary><Onboarding /></ErrorBoundary>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin"          element={<Admin />} />
        <Route path="/landing"        element={<Landing />} />
        <Route path="/premium"        element={<Premium />} />
        <Route path="*"               element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="sportfitplus-theme">
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
    </ThemeProvider>
  );
}

export default App;
