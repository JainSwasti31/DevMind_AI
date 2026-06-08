import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import RepositoryDetail from './pages/RepositoryDetail.jsx';
import Settings from './pages/Settings.jsx';
import Help from './pages/Help.jsx';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  // Pages where sidebar/navbar are hidden (landing, auth)
  const publicPages = ['/', '/auth'];
  const isPublicPage = publicPages.includes(location.pathname);
  const showChrome = user || !isPublicPage ? !!user : false;

  // Always show chrome if logged in — hide on landing & auth when not logged in
  const showSidebar = !!user;
  const showNavbar = !!user;

  return (
    <div className={`min-h-screen app-bg ${theme}`}>
      {showSidebar && <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />}
      {showNavbar && <Navbar sidebarCollapsed={collapsed} />}

      <main
        className="transition-all duration-300"
        style={{
          marginLeft: showSidebar ? (collapsed ? '60px' : '240px') : '0',
          paddingTop: showNavbar ? '64px' : '0',
        }}
      >
        <div className={`mx-auto px-6 py-8 ${showSidebar ? 'max-w-6xl' : 'max-w-7xl'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/repos/:id" element={<PrivateRoute><RepositoryDetail /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
