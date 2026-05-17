import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './features/auth/AuthProvider';

const LoginPage = lazy(async () => {
  const module = await import('./pages/LoginPage');
  return { default: module.LoginPage };
});

const AdminPage = lazy(async () => {
  const module = await import('./pages/AdminPage');
  return { default: module.AdminPage };
});

function RouteFallback() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function ProtectedRoute() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminPage />
    </Suspense>
  );
}

export default function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <Suspense fallback={<RouteFallback />}>
              <LoginPage />
            </Suspense>
          )
        }
      />
      <Route path="/" element={<ProtectedRoute />} />
      <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
    </Routes>
  );
}