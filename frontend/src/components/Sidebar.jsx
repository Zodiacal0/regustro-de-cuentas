import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, BarChart3, Target, Settings, Activity, X, Wallet, CreditCard, PieChart } from 'lucide-react';

function Sidebar({ isOpen, toggleSidebar }) {
  const closeSidebarOnMobile = () => {
    if (window.innerWidth <= 900) toggleSidebar();
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Activity size={28} />
          <div>Numera<span>.</span></div>
        </div>
        <button className="sidebar-close-btn" onClick={toggleSidebar}>
          <X size={24} />
        </button>
      </div>

      <div style={{ marginTop: '20px' }}></div>

      <NavLink to="/" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
        <LayoutDashboard size={20} /> Dashboard
      </NavLink>

      <NavLink to="/transacciones" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Receipt size={20} /> Transacciones
      </NavLink>

      <NavLink to="/analiticas" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <BarChart3 size={20} /> Analíticas
      </NavLink>

      <NavLink to="/objetivos" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Target size={20} /> Objetivos
      </NavLink>

      <NavLink to="/fondos" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Wallet size={20} /> Fondos
      </NavLink>

      <NavLink to="/deudas" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <CreditCard size={20} /> Deudas
      </NavLink>

      <NavLink to="/presupuesto" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <PieChart size={20} /> Presupuesto
      </NavLink>

      <div style={{ flex: 1 }}></div>

      <NavLink to="/ajustes" onClick={closeSidebarOnMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
        <Settings size={20} /> Ajustes
      </NavLink>
    </div>
  );
}

export default Sidebar;
