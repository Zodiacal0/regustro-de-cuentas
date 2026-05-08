import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

function AddGoalModal({ isOpen, onClose, currency, refreshData }) {
  const [formData, setFormData] = useState({
    nombre: '',
    monto_objetivo: '',
    monto_actual: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tipo_registro: 'objetivo',
      payload: {
        nombre: formData.nombre,
        monto_objetivo: Number(formData.monto_objetivo),
        monto_actual: Number(formData.monto_actual),
        porcentaje_completado: Number(((Number(formData.monto_actual) / Number(formData.monto_objetivo)) * 100).toFixed(2))
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
          setFormData({ nombre: '', monto_objetivo: '', monto_actual: '' });
          onClose(); 
        }, 1200);
      } else {
        alert("Error al agregar objetivo");
      }
    } catch (error) {
       console.error(error);
       alert("Error de red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nuevo Objetivo Financiero</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        {success ? (
          <div className="success-state">
            <div className="success-icon"><Check size={40} color="white" /></div>
            <h3>¡Éxito!</h3>
            <p>Objetivo guardado y monitoreado.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del Objetivo (Ej. Viaje a Japón)</label>
              <input 
                type="text" 
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Monto Objetivo Final</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{color: 'var(--text-muted)'}}>{currency}</span>
                  <input
                    type="number" step="0.01" required
                    value={formData.monto_objetivo}
                    onChange={e => setFormData({...formData, monto_objetivo: e.target.value})}
                    style={{flex: 1}}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Ahorro Actual</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{color: 'var(--text-muted)'}}>{currency}</span>
                  <input
                    type="number" step="0.01" required
                    value={formData.monto_actual}
                    onChange={e => setFormData({...formData, monto_actual: e.target.value})}
                    style={{flex: 1}}
                  />
                </div>
              </div>
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Procesando...' : 'Fijar Objetivo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddGoalModal;
