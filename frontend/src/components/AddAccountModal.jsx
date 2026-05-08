import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

function AddAccountModal({ isOpen, onClose, currency, refreshData }) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Cuenta Corriente', // Cuenta de Ahorro | Cuenta Corriente | Efectivo
    saldo: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tipo_registro: 'cuenta',
      payload: {
        nombre: formData.nombre,
        tipo: formData.tipo,
        saldo: Number(formData.saldo)
      }
    };

    try {
      const response = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        if (refreshData) refreshData();
        setTimeout(() => {
          setSuccess(false);
          setFormData({ nombre: '', tipo: 'Cuenta Corriente', saldo: '' });
          onClose();
        }, 1500);
      } else {
        alert("Error al agregar cuenta");
      }
    } catch (error) {
       console.error(error);
       alert("Error de red al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Agregar Nueva Cuenta</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        {success ? (
          <div className="success-state">
            <div className="success-icon"><Check size={40} color="white" /></div>
            <h3>¡Éxito!</h3>
            <p>Cuenta bancaria vinculada al sistema.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la Cuenta / Banco</label>
              <input 
                type="text" 
                placeholder="Ej. Banco Industrial, Billetera Efectivo..." 
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Cuenta</label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                >
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                  <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                  <option value="Cartera / Efectivo">Cartera / Efectivo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Saldo Inicial Liquido</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '18px', fontWeight: '500', color: 'var(--text-muted)'}}>{currency}</span>
                  <input
                    type="number" step="0.01" required
                    value={formData.saldo}
                    onChange={e => setFormData({...formData, saldo: e.target.value})}
                    style={{flex: 1}}
                  />
                </div>
              </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Integrar Cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddAccountModal;
