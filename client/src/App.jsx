import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, RequireAdmin } from "./hooks/useAuth";
import PublicShell from "./components/layout/PublicShell";
import AdminShell from "./components/layout/AdminShell";
import LandingPage from "./features/public/LandingPage";
import RegistrationPage from "./features/public/RegistrationPage";
import CheckInPage from "./features/public/CheckInPage";
import OrganizerLogin from "./features/auth/OrganizerLogin";
import OrganizerRegister from "./features/auth/OrganizerRegister";
import DashboardPage from "./features/admin/DashboardPage";
import RegistrationsPage from "./features/admin/RegistrationsPage";
import EventsManagerPage from "./features/admin/EventsManagerPage";
import EventBuilderPage from "./features/admin/EventBuilderPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/invite/:slug" element={<RegistrationPage />} />
            <Route path="/check-in" element={<CheckInPage />} />
          </Route>

          <Route path="/admin/login" element={<OrganizerLogin />} />
          <Route path="/admin/register" element={<OrganizerRegister />} />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminShell />
              </RequireAdmin>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="attendees" element={<RegistrationsPage />} />
            <Route path="events" element={<EventsManagerPage />} />
            <Route path="events/builder" element={<EventBuilderPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}