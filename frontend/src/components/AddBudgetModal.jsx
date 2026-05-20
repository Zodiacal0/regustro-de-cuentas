import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

const CATEGORIAS = [
  'Alimentación', 'Transporte', 'Servicios', 'Entretenimiento',
  'Salud', 'Educación', 'Ropa', 'Otros'
];

const PERIODOS = [
  { value: 'mensual',      label: 'Mensual' },
  { value: 'quincenal',    label: 'Quincenal' },
  { value: 'semanal',      label: 'Semanal' },
  { value: 'anual',        label: 'Anual' },
  { value: 'personalizado', label: 'Rango personalizado' },
];

const COLORES = [
  '#3a5849', '#4f46e5', '#f59e0b', '#ef4444',
  '#06b6d4', '#8b5cf6', '#10b981', '#f97316',
];

const today = new Date().toISOString().split('T')[0];
const DEFAULT = { nombre: '', categoria: 'Alimentación', monto_limite: '', periodo: 'mensual', color: '#3a5849', rollover: false, fecha_inicio: today, fecha_fin: today };

function AddBudgetModal({ isOpen, onClose, currency, refreshData, editBudget }) {
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (editBudget) {
      setForm({
        nombre: editBudget.nombre,
        categoria: editBudget.categoria,
        monto_limite: editBudget.monto_limite,
        periodo: editBudget.periodo,
        color: editBudget.color || '#3a5849',
        rollover: editBudget.rollover || false,
        fecha_inicio: editBudget.fecha_inicio || today,
        fecha_fin: editBudget.fecha_fin || today,
      });
    } else {
      setForm(DEFAULT);
    }
    setSuccess(false);
  }, [editBudget, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!editBudget;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.monto_limite || Number(form.monto_limite) <= 0) return alert('El monto límite debe ser mayor a 0');
    if (form.periodo === 'personalizado' && (!form.fecha_inicio || !form.fecha_fin)) return alert('Selecciona las fechas de inicio y fin');
    if (form.periodo === 'personalizado' && form.fecha_fin < form.fecha_inicio) return alert('La fecha fin debe ser igual o posterior a la fecha inicio');
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records/presupuesto/${editBudget._id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, monto_limite: Number(form.monto_limite) }),
        });
      } else {
        res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records`, {
          method: 'POST',
          body: JSON.stringify({ tipo_registro: 'presupuesto', payload: { ...form, monto_limite: Number(form.monto_limite) } }),
        });
      }
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        refreshData();
        setTimeout(() => { setSuccess(false); onClose(); }, 1100);
      } else {
        alert('Error: ' + data.message);
      }
    } catch { alert('Error de red'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEdit ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {success ? (
          <div className="success-state">
            <div className="success-icon"><Check size={40} color="white" /></div>
            <h3>{isEdit ? '¡Actualizado!' : '¡Creado!'}</h3>
            <p>Presupuesto guardado correctamente.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre del presupuesto</label>
              <input type="text" required placeholder="Ej. Comida del mes" value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Período</label>
                <select value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })}>
                  {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {form.periodo === 'personalizado' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha inicio</label>
                  <input type="date" required value={form.fecha_inicio}
                    onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Fecha fin</label>
                  <input type="date" required value={form.fecha_fin} min={form.fecha_inicio}
                    onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Límite de gasto</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{currency}</span>
                <input type="number" step="0.01" min="0.01" required value={form.monto_limite}
                  onChange={e => setForm({ ...form, monto_limite: e.target.value })}
                  style={{ flex: 1 }} placeholder="0.00" />
              </div>
            </div>

            <div className="form-group">
              <label>Color del presupuesto</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                {COLORES.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid #111' : '3px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }} />
                ))}
              </div>
            </div>

            {form.periodo !== 'personalizado' && <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label style={{ marginBottom: '2px' }}>Rollover de saldo</label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  El saldo no usado del período anterior se suma al siguiente
                </p>
              </div>
              <button type="button" onClick={() => setForm({ ...form, rollover: !form.rollover })}
                style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: form.rollover ? 'var(--primary)' : '#d1d5db', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: '2px', left: form.rollover ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddBudgetModal;
