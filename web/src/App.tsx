import '@fontsource/familjen-grotesk/400.css';
import '@fontsource/familjen-grotesk/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/600.css';
import './styles/globals.css';

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { AdminShopBar } from './components/AdminShopBar.tsx';

// Lazy page imports
import { lazy, Suspense } from 'react';

const SignInPage = lazy(() => import('./pages/SignIn.tsx'));
const ScanLandingPage = lazy(() => import('./pages/ScanLanding.tsx'));

// Customer
const CardHomePage = lazy(() => import('./pages/customer/CardHome.tsx'));
const CardDetailPage = lazy(() => import('./pages/customer/CardDetail.tsx'));
const RewardsPage = lazy(() => import('./pages/customer/Rewards.tsx'));
const ScratchCardPage = lazy(() => import('./pages/customer/ScratchCard.tsx'));
const StampSuccessPage = lazy(() => import('./pages/customer/StampSuccess.tsx'));
const ExplorePage = lazy(() => import('./pages/customer/Explore.tsx'));

// Shop
const ShopDashboardPage = lazy(() => import('./pages/shop/Dashboard.tsx'));
const ShopQrPage = lazy(() => import('./pages/shop/QrDisplay.tsx'));
const ShopFeedPage = lazy(() => import('./pages/shop/Feed.tsx'));
const ShopRedeemPage = lazy(() => import('./pages/shop/Redeem.tsx'));
const ShopCustomersPage = lazy(() => import('./pages/shop/Customers.tsx'));
const ShopProgramPage = lazy(() => import('./pages/shop/Program.tsx'));
const ShopScanCustomerPage = lazy(() => import('./pages/shop/ScanCustomer.tsx'));
const PrintQrPage = lazy(() => import('./pages/shop/PrintQr.tsx'));

// Admin
const AdminCreateShopPage = lazy(() => import('./pages/admin/CreateShop.tsx'));
const AdminShopsPage = lazy(() => import('./pages/admin/Shops.tsx'));
const AdminFlagsPage = lazy(() => import('./pages/admin/Flags.tsx'));

// Dev Atlas
const AtlasPage = lazy(() => import('./pages/Atlas.tsx'));

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function LoadingScreen() {
  return (
    <div className="loading-center">
      <div className="spinner" aria-label="Loading…" />
    </div>
  );
}

function ShopLayout() {
  return (
    <>
      <AdminShopBar />
      <Outlet />
    </>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Scan landing (public, redirects to sign-in if needed) */}
        <Route path="/s/:slug" element={<ScanLandingPage />} />

        {/* Dev Design System Atlas */}
        <Route path="/__atlas" element={<AtlasPage />} />

        {/* Sign-in */}
        <Route path="/sign-in" element={!user ? <SignInPage /> : <Navigate to="/" replace />} />

        {/* Customer routes */}
        {user?.role === 'customer' && (
          <>
            <Route path="/" element={<CardHomePage />} />
            <Route path="/cards/:slug" element={<CardDetailPage />} />
            <Route path="/m/:slug" element={<CardDetailPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/scratch/:id" element={<ScratchCardPage />} />
            <Route path="/stamp-success" element={<StampSuccessPage />} />
          </>
        )}

        {/* Admin routes */}
        {user?.role === 'admin' && (
          <>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminShopsPage />} />
            <Route path="/admin/create-shop" element={<AdminCreateShopPage />} />
            <Route path="/admin/flags" element={<AdminFlagsPage />} />
            <Route element={<ShopLayout />}>
              <Route path="/shop" element={<ShopDashboardPage />} />
              <Route path="/shop/scan" element={<ShopScanCustomerPage />} />
              <Route path="/shop/print-qr" element={<PrintQrPage />} />
              <Route path="/shop/qr" element={<ShopQrPage />} />
              <Route path="/shop/feed" element={<ShopFeedPage />} />
              <Route path="/shop/redeem" element={<ShopRedeemPage />} />
              <Route path="/shop/customers" element={<ShopCustomersPage />} />
              <Route path="/shop/program" element={<ShopProgramPage />} />
            </Route>
          </>
        )}

        {/* Shop routes */}
        {user?.role === 'shop' && (
          <>
            <Route path="/" element={<Navigate to="/shop" replace />} />
            <Route element={<ShopLayout />}>
              <Route path="/shop" element={<ShopDashboardPage />} />
              <Route path="/shop/scan" element={<ShopScanCustomerPage />} />
              <Route path="/shop/print-qr" element={<PrintQrPage />} />
              <Route path="/shop/qr" element={<ShopQrPage />} />
              <Route path="/shop/feed" element={<ShopFeedPage />} />
              <Route path="/shop/redeem" element={<ShopRedeemPage />} />
              <Route path="/shop/customers" element={<ShopCustomersPage />} />
              <Route path="/shop/program" element={<ShopProgramPage />} />
            </Route>
          </>
        )}

        {/* Fallback */}
        <Route
          path="*"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/sign-in" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

