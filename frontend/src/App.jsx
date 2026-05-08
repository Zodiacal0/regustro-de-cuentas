import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import Fondos from './pages/Fondos';
import Deudas from './pages/Deudas';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { apiFetch } from './utils/apiFetch';

const PAGE_META = {
  '/':             { title: 'Hola, ¡Bienvenido de vuelta!',    desc: 'Explora la información y actividad financiera de tus registros.' },
  '/transacciones':{ title: 'Transacciones Históricas',         desc: 'Todos tus movimientos contables unificados en un solo lugar.' },
  '/analiticas':   { title: 'Reportes y Analíticas',            desc: 'Observa tu comportamiento e inteligencia financiera.' },
  '/ajustes':      { title: 'Ajustes de Cuenta',                desc: 'Personaliza tus preferencias y perfil.' },
  '/objetivos':    { title: 'Metas Financieras',                desc: 'Persigue tus metas conectando tus ahorros e inversiones.' },
  '/fondos':       { title: 'Gestión de Fondos',                desc: 'Administra tus cuentas bancarias, tarjetas y efectivo.' },
  '/deudas':       { title: 'Control de Deudas',                desc: 'Rastrea y salda tus compromisos financieros.' },
};

function AppLayout() {
  const [currency, setCurrency] = useState('Q');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState({
    entradas: [], gastos: [], objetivos: [], tarjetas: [], cuentas: [], deudas: []
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records`);
      const json = await res.json();
      if (json.success) setGlobalData(json.data);
    } catch (e) {
      console.error("Fallo conectando a B.L.A.S.T API:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const location = useLocation();
  const meta = PAGE_META[location.pathname] || PAGE_META['/'];

  const allTransactions = [
    ...globalData.gastos.map(g => ({ ...g, isExpense: true })),
    ...globalData.entradas.map(e => ({ ...e, isExpense: false }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const filteredTransactions = searchQuery.trim() === ''
    ? allTransactions
    : allTransactions.filter(tx =>
        tx.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.categoria?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Header
          toggleSidebar={toggleSidebar}
          currency={currency}
          setCurrency={setCurrency}
          title={meta.title}
          description={meta.desc}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <h3 style={{ color: 'var(--text-muted)' }}>Sincronizando Sistema...</h3>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard currency={currency} raw={globalData} transactions={filteredTransactions} refreshData={fetchRecords} />} />
            <Route path="/transacciones" element={<Transactions currency={currency} raw={globalData} transactions={filteredTransactions} refreshData={fetchRecords} />} />
            <Route path="/analiticas" element={<Analytics currency={currency} transactions={filteredTransactions} />} />
            <Route path="/objetivos" element={<Goals currency={currency} raw={globalData} refreshData={fetchRecords} />} />
            <Route path="/fondos" element={<Fondos currency={currency} raw={globalData} refreshData={fetchRecords} />} />
            <Route path="/deudas" element={<Deudas currency={currency} raw={globalData} refreshData={fetchRecords} />} />
            <Route path="/ajustes" element={<Settings />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
