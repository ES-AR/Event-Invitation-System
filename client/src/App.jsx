import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import Register from "./pages/public/Register";
import CheckIn from "./pages/public/CheckIn";
import RegistrationClosed from "./pages/public/RegistrationClosed";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Attendees from "./pages/admin/Attendees";
import EventSettings from "./pages/admin/EventSettings";

// Fallback
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Register />} />
          <Route path="/check-in" element={<CheckIn />} />
          <Route path="/closed" element={<RegistrationClosed />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="attendees" element={<Attendees />} />
          <Route path="settings" element={<EventSettings />} />
        </Route>

        {/* NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
