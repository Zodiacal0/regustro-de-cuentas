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

function AppLayout() {
  const [currency, setCurrency] = useState('Q');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // DATA GLOBAL 
  const [loading, setLoading] = useState(true);
  const [globalData, setGlobalData] = useState({
    entradas: [],
    gastos: [],
    objetivos: [],
    tarjetas: [],
    cuentas: []
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/records`);
      const json = await res.json();
      if (json.success) {
        setGlobalData(json.data);
      }
    } catch (e) {
      console.error("Fallo conectando a B.L.A.S.T API:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const location = useLocation();

  let title = "Hola, ¡Bienvenido de vuelta!";
  let description = "Explora la información y actividad financiera de tus registros.";

  if (location.pathname === '/transacciones') {
    title = "Transacciones Históricas";
    description = "Todos tus movimientos contables unificados en un solo lugar.";
  } else if (location.pathname === '/analiticas') {
    title = "Reportes y Analíticas";
    description = "Observa tu comportamiento e inteligencia financiera.";
  } else if (location.pathname === '/ajustes') {
    title = "Ajustes de Cuenta";
    description = "Personaliza tus preferencias y perfil.";
  } else if (location.pathname === '/objetivos') {
    title = "Objetivos Financieros";
    description = "Persigue tus metas conectando tus ahorros e inversiones.";
  }

  // Juntar Entradas y Gastos en una sola lista universal con flag isExpense, para poder filtrar todo de un jalón
  const allTransactions = [
    ...globalData.gastos.map(g => ({ ...g, isExpense: true })),
    ...globalData.entradas.map(e => ({ ...e, isExpense: false }))
  ].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

  // Lógica Nativa del Buscador
  const filteredTransactions = searchQuery.trim() === '' 
    ? allTransactions 
    : allTransactions.filter(tx => 
        tx.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tx.categoria?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Overlay para móviles */}
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <Header 
          toggleSidebar={toggleSidebar}
          currency={currency} 
          setCurrency={setCurrency} 
          title={title} 
          description={description}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery} 
        />
        
        {loading ? (
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}>
            <h3 style={{color: 'var(--text-muted)'}}>Sincronizando Sistema...</h3>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard 
              currency={currency} 
              raw={globalData} 
              transactions={filteredTransactions} 
              refreshData={fetchRecords} 
            />} />
            <Route path="/transacciones" element={<Transactions 
              currency={currency} 
              raw={globalData}
              transactions={filteredTransactions}
              refreshData={fetchRecords} 
            />} />
            <Route path="/analiticas" element={<Analytics 
              currency={currency} 
              transactions={filteredTransactions} 
            />} />
            <Route path="/objetivos" element={<Goals 
              currency={currency} 
              raw={globalData} 
              refreshData={fetchRecords} 
            />} />
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
      <AppLayout />
    </Router>
  );
}

export default App;
