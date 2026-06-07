import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Home from './pages/Home.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Upload from './pages/Upload.jsx';
import RepositoryDetail from './pages/RepositoryDetail.jsx';

function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#060912]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Navbar sidebarCollapsed={collapsed} />

      {/* Main content — offset by sidebar + navbar */}
      <main
        className="transition-all duration-300 pt-16"
        style={{ marginLeft: collapsed ? '60px' : '240px' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/repos/:id" element={<PrivateRoute><RepositoryDetail /></PrivateRoute>} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;
