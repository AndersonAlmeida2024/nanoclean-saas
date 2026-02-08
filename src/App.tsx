// arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';

// Lazy loading das páginas para reduzir bundle inicial (PERF)
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CRMPage = lazy(() => import('./pages/CRMPage').then(m => ({ default: m.CRMPage })));
const FinancePage = lazy(() => import('./pages/FinancePage').then(m => ({ default: m.FinancePage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const BranchesPage = lazy(() => import('./pages/BranchesPage').then(m => ({ default: m.BranchesPage }))); // Nova
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AppLayout = lazy(() => import('./layouts/AppLayout').then(m => ({ default: m.AppLayout })));
const ShareAppointmentPage = lazy(() => import('./pages/ShareAppointmentPage').then(m => ({ default: m.ShareAppointmentPage })));
const AdminCompaniesPage = lazy(() => import('./pages/AdminCompaniesPage').then(m => ({ default: m.AdminCompaniesPage })));

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado.</h1>
          <p className="text-gray-400 max-w-md mb-8">
            Ocorreu um erro inesperado na renderização. Tente recarregar a página ou entre em contato com o suporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all"
          >
            Recarregar Aplicação
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, platformContextLoaded } = useAuthStore();

  if (isLoading || !platformContextLoaded) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// Removed unused route guards (kept minimal routing in App). If needed,
// reintroduce and use them where appropriate.

export default function App() {
  const { initialize, isAuthenticated, isPlatformAdmin, memberships, activeCompanyId } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auxiliares de Permissão
  const activeMembership = memberships.find(m => m.company_id === activeCompanyId);
  const isMatrix = activeMembership?.companies?.company_type === 'matrix';
  const isOwnerOrAdmin = activeMembership?.role === 'owner' || activeMembership?.role === 'admin';

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/forgot" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
            <Route path="/reset" element={<ResetPasswordPage />} />
            <Route path="/share/:token" element={<ShareAppointmentPage />} />

            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="crm" element={<CRMPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="schedule" element={<SchedulePage />} />

              {/* Gestão de Filiais (Restrito à Matriz / Admin) */}
              <Route
                path="branches"
                element={(isMatrix && isOwnerOrAdmin) ? <BranchesPage /> : <Navigate to="/" replace />}
              />

              {/* Rotas Administrativas (Platform Only) */}
              {isPlatformAdmin && (
                <>
                  <Route path="admin/companies" element={<AdminCompaniesPage />} />
                </>
              )}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
