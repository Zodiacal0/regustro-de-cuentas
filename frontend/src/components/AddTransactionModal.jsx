import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

function AddTransactionModal({ isOpen, onClose, currency, refreshData, raw }) {
  const [registroTipo, setRegistroTipo] = useState('gastos'); // gastos | entradas
  const [origenTipo, setOrigenTipo] = useState('Cuenta'); // Cuenta | Tarjeta
  const tarjetasDisponibles = raw?.tarjetas || [];
  const cuentasDisponibles = raw?.cuentas || [];
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoria: '',
    cuenta_id: '',
    tarjeta_id: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ajustar campos según B.L.A.S.T schema
    const basePayload = {
      descripcion: formData.descripcion,
      monto: Number(formData.monto),
      fecha: new Date(formData.fecha).toISOString(),
      categoria: formData.categoria || (registroTipo === 'gastos' ? 'Otros Gastos' : 'Otros Ingresos')
    };

    if (registroTipo === 'gastos') {
      basePayload.metodo_pago = origenTipo === 'Cuenta' ? 'Efectivo/Transferencia' : 'Tarjeta';
    }
    
    if (origenTipo === 'Cuenta' && formData.cuenta_id) {
        basePayload.cuenta_id = formData.cuenta_id;
    } else if (origenTipo === 'Tarjeta' && formData.tarjeta_id) {
        basePayload.tarjeta_id = formData.tarjeta_id;
    }

    const payload = {
      tipo_registro: registroTipo,
      payload: basePayload
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFormData({...formData, descripcion: '', monto: '', cuenta_id: '', tarjeta_id: ''});
          refreshData(); // Llama a la BD de nuevo!
          onClose(); 
        }, 1200);
      } else {
        alert("Error al agregar transacción");
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
          <h2>Agregar Operación</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        {success ? (
          <div className="success-state">
            <div className="success-icon"><Check size={40} color="white" /></div>
            <h3>¡Éxito!</h3>
            <p>Registro Contable guardado.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ flexDirection: 'row', gap: '10px' }}>
               <button 
                type="button" 
                onClick={() => setRegistroTipo('entradas')}
                className={`filter-btn ${registroTipo === 'entradas' ? 'active' : ''}`}
                style={{flex: 1, padding: '10px'}}
              >Ingreso (+)</button>
               <button 
                type="button" 
                onClick={() => setRegistroTipo('gastos')}
                className={`filter-btn ${registroTipo === 'gastos' ? 'active' : ''}`}
                style={{flex: 1, padding: '10px'}}
              >Gasto (-)</button>
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <input 
                type="text" 
                placeholder="Ej. Supermercado, Salario quincena..." 
                required
                value={formData.descripcion}
                onChange={e => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Monto</label>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '18px', fontWeight: '500', color: 'var(--text-muted)'}}>{currency}</span>
                  <input
                    type="number" step="0.01" required
                    value={formData.monto}
                    onChange={e => setFormData({...formData, monto: e.target.value})}
                    style={{flex: 1}}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input
                  type="date" required
                  value={formData.fecha}
                  onChange={e => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Categoría</label>
              <select 
                required
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value})}
              >
                <option value="">Seleccione Categoría...</option>
                {registroTipo === 'gastos' ? (
                  <>
                    <option value="Alimentación">Alimentación</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                    <option value="Entretenimiento">Entretenimiento</option>
                    <option value="Salud">Salud</option>
                    <option value="Educación">Educación</option>
                    <option value="Ropa">Ropa</option>
                    <option value="Otros">Otros</option>
                  </>
                ) : (
                  <>
                    <option value="Salario">Salario</option>
                    <option value="Negocio">Negocio / Ventas</option>
                    <option value="Regalo">Regalo</option>
                    <option value="Inversiones">Inversiones</option>
                    <option value="Otros">Otros</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
                <label>Origen / Destino de Fondos</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                         <input type="radio" checked={origenTipo === 'Cuenta'} onChange={() => setOrigenTipo('Cuenta')} />
                         Bancario / Efectivo
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer'}}>
                         <input type="radio" checked={origenTipo === 'Tarjeta'} onChange={() => setOrigenTipo('Tarjeta')} />
                         Tarjeta (Crédito/Débito)
                     </label>
                </div>
                
                {origenTipo === 'Cuenta' && cuentasDisponibles.length > 0 && (
                  <select value={formData.cuenta_id} onChange={e => setFormData({...formData, cuenta_id: e.target.value})}>
                    <option value="">Seleccione Cuenta...</option>
                    {cuentasDisponibles.map(c => (
                      <option key={c._id} value={c._id}>{c.nombre} ({c.tipo})</option>
                    ))}
                  </select>
                )}

                {origenTipo === 'Tarjeta' && tarjetasDisponibles.length > 0 && (
                  <select value={formData.tarjeta_id} onChange={e => setFormData({...formData, tarjeta_id: e.target.value})}>
                    <option value="">Seleccione Tarjeta...</option>
                    {tarjetasDisponibles.map(t => (
                      <option key={t._id} value={t._id}>{t.nombre} ({t.tipo})</option>
                    ))}
                  </select>
                )}
            </div>
            
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Añadir Registro'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddTransactionModal;
