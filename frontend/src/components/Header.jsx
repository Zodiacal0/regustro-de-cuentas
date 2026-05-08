import React, { useState } from 'react';
import { Search, Bell, User, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header({ currency, setCurrency, title, description, searchQuery, setSearchQuery, toggleSidebar }) {
  const [showMenu, setShowMenu] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="header">
      <div className="mobile-header-left">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="header-titles">
          <h1>{title}</h1>
          <p className="header-desc">{description}</p>
        </div>
      </div>
      <div className="header-actions">
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Buscar transacciones..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="icon-btn">
          <Bell size={18} />
        </div>
        
        <div 
          className="icon-btn" 
          style={{ fontWeight: '500', fontSize: '18px', cursor: 'pointer', background: 'var(--primary)', color: 'white' }}
          onClick={() => setCurrency(currency === 'Q' ? '$' : 'Q')}
          title="Cambiar Moneda"
        >
          {currency}
        </div>
        
        {/* Menú de Usuario */}
        <div style={{ position: 'relative' }}>
          <div 
            className="icon-btn" 
            style={{backgroundColor: '#e5e7eb', cursor: 'pointer'}}
            onClick={() => setShowMenu(!showMenu)}
          >
            <User size={18} />
          </div>
          
          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '55px',
              right: '0',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              padding: '10px 0',
              minWidth: '150px',
              zIndex: 50
            }}>
              {user && <div style={{padding: '8px 20px', fontSize: '13px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '4px'}}>{user.name}</div>}
              <div onClick={handleLogout} style={{padding: '8px 20px', cursor: 'pointer', fontSize: '14px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <LogOut size={14} /> Cerrar Sesión
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Header;
