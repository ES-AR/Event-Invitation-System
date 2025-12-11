import { NavLink, Route, Routes } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AdminPage from './pages/AdminPage';
import CheckInPage from './pages/CheckInPage';

const navClasses = ({ isActive }) =>
  `px-4 py-2 rounded-lg font-semibold transition ${
    isActive ? 'bg-secondary text-white' : 'text-secondary hover:bg-gray-200'
  }`;

function App() {
  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-white font-bold text-lg">
              EV
            </span>
            <div>
              <p className="text-sm text-gray-500">Quota-Controlled</p>
              <p className="font-semibold text-secondary">Event Invitation System</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <NavLink className={navClasses} to="/">
              Register
            </NavLink>
            <NavLink className={navClasses} to="/admin">
              Admin
            </NavLink>
            <NavLink className={navClasses} to="/check-in">
              Check-In
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <Routes>
          <Route path="/" element={<RegistrationPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/check-in" element={<CheckInPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
