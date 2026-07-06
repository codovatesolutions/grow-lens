import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";
import { Toaster } from "./components/ui/sonner";
import Shell from "./components/Shell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NewScan from "./pages/NewScan";
import Results from "./pages/Results";
import Leads from "./pages/Leads";
import CreatorInsights from "./pages/CreatorInsights";
import Planner from "./pages/Planner";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import PublicScan from "./pages/PublicScan";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Shell>{children}</Shell>;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/public/scan/:id" element={<PublicScan />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/scan/new" element={<Protected><NewScan /></Protected>} />
            <Route path="/scan/:id" element={<Protected><Results /></Protected>} />
            <Route path="/leads" element={<Protected><Leads /></Protected>} />
            <Route path="/creator" element={<Protected><CreatorInsights /></Protected>} />
            <Route path="/planner" element={<Protected><Planner /></Protected>} />
            <Route path="/reports" element={<Protected><Reports /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/billing" element={<Protected><Billing /></Protected>} />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
