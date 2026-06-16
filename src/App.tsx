import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "@/components/ui/toaster";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { Home } from "@/pages/Home";
import { Explore } from "@/pages/Explore";
import { NewPost } from "@/pages/NewPost";
import { ProfilePage, EditProfilePage } from "@/pages/ProfilePages";
import { ChatPage } from "@/pages/ChatPage";

function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isChatRoom = /^\/chat\/.+/.test(location.pathname);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className={isChatRoom ? "flex-1" : "flex-1 pb-20"}>{children}</main>
      <BottomNav />
    </div>
  );
}

function ProfileRedirect() {
  const { profile, loading } = useApp();

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/u/${profile.username}`} replace />;
}

function AppRoutes() {
  const { session, loading } = useApp();

  return (
    <Routes>
      <Route
        path="/login"
        element={session && !loading ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={
          session && !loading ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <Home />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <AppShell>
              <Explore />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <NewPost />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <AppShell>
              <ChatPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <AppShell>
              <ChatPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfileRedirect />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <AppShell>
              <EditProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/u/:username"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProfilePage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AppProvider>
  );
}
