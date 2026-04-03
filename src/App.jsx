import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import Inscribe from './pages/Inscribe';
import Collective from './pages/Collective';
import MyRecords from './pages/MyRecords';
import HiddenArchitecture from './pages/HiddenArchitecture';
import DeveloperGateway from './pages/DeveloperGateway';
import ResonanceDashboard from './pages/ResonanceDashboard';
import ResonanceField from './pages/ResonanceField';
import ResonanceComparison from './pages/ResonanceComparison';
import ResonanceNetwork from './pages/ResonanceNetwork';
import MyResonance from './pages/MyResonance';
import BinauralStudio from './pages/BinauralStudio';
import PulseCheckIn from './pages/PulseCheckIn';
import FirstPulse from './pages/FirstPulse';
import AstroResonanceLab from './pages/AstroResonanceLab';
import IntentionCircles from './pages/IntentionCircles';
import ResonanceGlobe3D from './pages/ResonanceGlobe3D';
import FrequencyMonitor from './pages/FrequencyMonitor';
import Resonance4D from './pages/Resonance4D';
import AtmosphericComposer from './pages/AtmosphericComposer';
import ResonanceMastery from './pages/ResonanceMastery';

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
        <Route path="/astro-lab" element={<AstroResonanceLab />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
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