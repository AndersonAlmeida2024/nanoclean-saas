// arquivo: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuthStore } from './stores/authStore';

// Lazy loading das páginas para reduzir bundle inicial (PERF)
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
// const CRMPage = lazy(() => import('./pages/CRMPage').then(m => ({ default: m.CRMPage })));
const FinancePage = lazy(() => import('./pages/FinancePage').then(m => ({ default: m.FinancePage })));
const SchedulePage = lazy(() => import('./pages/SchedulePage').then(m => ({ default: m.SchedulePage })));
const BranchesPage = lazy(() => import('./pages/BranchesPage').then(m => ({ default: m.BranchesPage }))); // Nova
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const AppLayout = lazy(() => import('./layouts/AppLayout').then(m => ({ default: m.AppLayout })));
const ShareAppointmentPage = lazy(() => import('./pages/ShareAppointmentPage').then(m => ({ default: m.ShareAppointmentPage })));
const ReportPublicPage = lazy(() => import('./pages/ReportPublicPage').then(m => ({ default: m.ReportPublicPage })));
const AdminCompaniesPage = lazy(() => import('./pages/AdminCompaniesPage').then(m => ({ default: m.AdminCompaniesPage })));
const TechnicianPortalPage = lazy(() => import('./pages/TechnicianPortalPage').then(m => ({ default: m.TechnicianPortalPage })));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'));

// Novas páginas (Refatoração de Navegação)
const SalesPage = lazy(() => import('./pages/SalesPage').then(m => ({ default: m.SalesPage })));
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ReactivationPage = lazy(() => import('./pages/ReactivationPage').then(m => ({ default: m.ReactivationPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { ConfirmationModal } from './components/ConfirmationModal';

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
  const isTechnician = activeMembership?.role === 'technician';

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
            <Route path="/share/report/:token" element={<ReportPublicPage />} />
            <Route path="/laudo/:client/:item/:token" element={<ReportPublicPage />} />

            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={isTechnician ? <Navigate to="/portal" replace /> : <DashboardPage />} />

              {/* 
                ⚠️ [LOCK] NAVEGAÇÃO ESTRATÉGICA - NÃO ALTERAR SEM ORDEM SUPERIOR 
                Estas rotas são cruciais para a nova UX 2026.
              */}
              <Route path="vendas" element={<SalesPage />} />
              <Route path="clientes" element={<ClientsPage />} />
              <Route path="reativacao" element={<ReactivationPage />} />
              <Route path="equipe" element={<TeamPage />} />
              {/* ⚠️ FIM DO BLOQUEIO */}

              {/* Rotas Existentes */}
              <Route path="crm" element={<Navigate to="/vendas" replace />} /> {/* Redirect antigo */}
              <Route path="finance" element={<FinancePage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="portal" element={<TechnicianPortalPage />} />
              <Route path="portal" element={<TechnicianPortalPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />

              {/* Gestão de Filiais (Restrito à Matriz / Admin) */}
              <Route
                path="branches"
                element={(isMatrix && isOwnerOrAdmin) ? <BranchesPage /> : <Navigate to="/" replace />}
              />

              {/* Rotas Administrativas (Platform Only) */}
              {isPlatformAdmin && (
                <>
                  <Route path="admin/companies" element={<AdminCompaniesPage />} />
                  <Route path="admin/audit" element={<AdminAuditPage />} />
                </>
              )}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <ToastContainer />
        <ConfirmationModal />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
