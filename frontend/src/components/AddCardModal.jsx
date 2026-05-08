import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

function AddCardModal({ isOpen, onClose, currency, refreshData }) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Crédito',
    saldo: '',
    fecha_corte: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tipo_registro: 'tarjeta',
      payload: {
        nombre: formData.nombre,
        tipo: formData.tipo,
        saldo: Number(formData.saldo),
        // Si es tarjeta de débito se omite o se asegura la fecha de corte opcional
        fecha_corte: formData.tipo === 'Crédito' ? Number(formData.fecha_corte) : undefined
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
        if (refreshData) refreshData(); // Recarga la info general
        setTimeout(() => {
          setSuccess(false);
          setFormData({ nombre: '', tipo: 'Crédito', saldo: '', fecha_corte: '' });
          onClose(); // Cerrar modal después del éxito
        }, 1500);
      } else {
        alert("Error al agregar tarjeta");
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
          <h2>Agregar Nueva Tarjeta</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        {success ? (
          <div className="success-state">
            <div className="success-icon"><Check size={40} color="white" /></div>
            <h3>¡Tarjeta Registrada!</h3>
            <p>Tu información contable ha sido conectada.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la Tarjeta</label>
              <input 
                type="text" 
                placeholder="Ej. Nu, Banamex, Santander" 
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Tipo de Tarjeta</label>
              <select 
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="Crédito">Crédito</option>
                <option value="Débito">Débito</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>{formData.tipo === 'Crédito' ? 'Saldo Adeudado' : 'Saldo Disponible'}</label>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '18px', fontWeight: '500', color: 'var(--text-muted)'}}>{currency}</span>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  required
                  value={formData.saldo}
                  onChange={e => setFormData({...formData, saldo: e.target.value})}
                  style={{flex: 1}}
                />
              </div>
            </div>
            
            {formData.tipo === 'Crédito' && (
              <div className="form-group">
                <label>Día de Corte (Mensual)</label>
                <input 
                  type="number" 
                  min="1" max="31" 
                  placeholder="Ej. 15" 
                  required
                  value={formData.fecha_corte}
                  onChange={e => setFormData({...formData, fecha_corte: e.target.value})}
                />
              </div>
            )}
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar y Conectar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddCardModal;
