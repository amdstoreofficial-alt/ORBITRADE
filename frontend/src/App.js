import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import PageBackground from './components/PageBackground';
import InstallPrompt from './components/InstallPrompt';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AccountSetup from './pages/AccountSetup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Affiliate from './pages/Affiliate';
import Legal from './pages/Legal';
import Tournaments from './pages/Tournaments';

const ProtectedRoute = ({ children, adminOnly = false, realOnly = false }) => {
  const { isAuthenticated, isAdmin, loading, needsAccountSetup, isDemoMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (needsAccountSetup) return <Navigate to="/account-setup" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, needsAccountSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (needsAccountSetup) return <Navigate to="/account-setup" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const SetupRoute = ({ children }) => {
  const { isAuthenticated, loading, needsAccountSetup } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-electric border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!needsAccountSetup) return <Navigate to="/dashboard" replace />;

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/account-setup" element={<SetupRoute><AccountSetup /></SetupRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
      <Route path="/deposit/success" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
      <Route path="/affiliate" element={<ProtectedRoute><Affiliate /></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      <Route path="/legal/:type" element={<Legal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-app text-gray-300 font-sans overflow-x-hidden antialiased">
          <PageBackground />
          <AppRoutes />
          <InstallPrompt />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#111827', color: '#e5e7eb',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'
              },
              success: { iconTheme: { primary: '#2af5ff', secondary: '#111827' } },
              error: { iconTheme: { primary: '#9d4edd', secondary: '#111827' } }
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
