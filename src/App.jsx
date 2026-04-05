import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Inscribe = lazy(() => import('./pages/Inscribe'));
const Collective = lazy(() => import('./pages/Collective'));
const MyRecords = lazy(() => import('./pages/MyRecords'));
const HiddenArchitecture = lazy(() => import('./pages/HiddenArchitecture'));
const DeveloperGateway = lazy(() => import('./pages/DeveloperGateway'));
const ResonanceDashboard = lazy(() => import('./pages/ResonanceDashboard'));
const ResonanceField = lazy(() => import('./pages/ResonanceField'));
const ResonanceComparison = lazy(() => import('./pages/ResonanceComparison'));
const ResonanceNetwork = lazy(() => import('./pages/ResonanceNetwork'));
const MyResonance = lazy(() => import('./pages/MyResonance'));
const BinauralStudio = lazy(() => import('./pages/BinauralStudio'));
const PulseCheckIn = lazy(() => import('./pages/PulseCheckIn'));
const FirstPulse = lazy(() => import('./pages/FirstPulse'));
const AstroResonanceLab = lazy(() => import('./pages/AstroResonanceLab'));
const IntentionCircles = lazy(() => import('./pages/IntentionCircles'));
const ResonanceGlobe3D = lazy(() => import('./pages/ResonanceGlobe3D'));
const FrequencyMonitor = lazy(() => import('./pages/FrequencyMonitor'));
const Resonance4D = lazy(() => import('./pages/Resonance4D'));
const AtmosphericComposer = lazy(() => import('./pages/AtmosphericComposer'));
const ResonanceMastery = lazy(() => import('./pages/ResonanceMastery'));
const CollectiveFieldRadio = lazy(() => import('./pages/CollectiveFieldRadio'));
const SynesthesiaEngine = lazy(() => import('./pages/SynesthesiaEngine'));
const ResonanceHotspotMap = lazy(() => import('./pages/ResonanceHotspotMap'));
const HarmonyNetwork = lazy(() => import('./pages/HarmonyNetwork'));

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/inscribe" element={<Inscribe />} />
        <Route path="/collective" element={<Collective />} />
        <Route path="/my-records" element={<MyRecords />} />
        <Route path="/hidden-architecture" element={<HiddenArchitecture />} />
        <Route path="/contribute" element={<DeveloperGateway />} />
        <Route path="/resonance-dashboard" element={<ResonanceDashboard />} />
        <Route path="/resonance-field" element={<ResonanceField />} />
        <Route path="/resonance-comparison" element={<ResonanceComparison />} />
        <Route path="/resonance-network" element={<ResonanceNetwork />} />
        <Route path="/my-resonance" element={<MyResonance />} />
        <Route path="/binaural-studio" element={<BinauralStudio />} />
        <Route path="/pulse" element={<PulseCheckIn />} />
        <Route path="/intention-circles" element={<IntentionCircles />} />
        <Route path="/resonance-globe" element={<ResonanceGlobe3D />} />
        <Route path="/frequency-monitor" element={<FrequencyMonitor />} />
        <Route path="/first-pulse" element={<FirstPulse />} />
        <Route path="/resonance-4d" element={<Resonance4D />} />
        <Route path="/atmospheric-composer" element={<AtmosphericComposer />} />
        <Route path="/resonance-mastery" element={<ResonanceMastery />} />
        <Route path="/field-radio" element={<CollectiveFieldRadio />} />
        <Route path="/synesthesia" element={<SynesthesiaEngine />} />
        <Route path="/hotspot-map" element={<ResonanceHotspotMap />} />
        <Route path="/harmony-network" element={<HarmonyNetwork />} />
        <Route path="/astro-lab" element={<AstroResonanceLab />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App