import React, { useState, useEffect } from 'react';
import { X, Check, PlusCircle, SlidersHorizontal } from 'lucide-react';
import confetti from 'canvas-confetti';

function EditGoalModal({ isOpen, onClose, currency, refreshData, activeGoal }) {
  const [mode, setMode] = useState('abono'); // 'abono' | 'total'
  const [abono, setAbono] = useState('');
  const [totalActual, setTotalActual] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (activeGoal) {
      setTotalActual(activeGoal.monto_actual);
      setAbono('');
      setMode('abono');
    }
  }, [activeGoal]);

  if (!isOpen || !activeGoal) return null;

  const nuevoTotal = mode === 'abono'
    ? activeGoal.monto_actual + Number(abono || 0)
    : Number(totalActual || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      monto_actual: nuevoTotal,
      monto_objetivo: activeGoal.monto_objetivo
    };
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/records/objetivo/${activeGoal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (refreshData) refreshData();
        if (nuevoTotal >= activeGoal.monto_objetivo && activeGoal.monto_actual < activeGoal.monto_objetivo) {
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#3a5849', '#7da18e', '#f59e0b', '#22c55e'] });
        }
        setTimeout(() => { setSuccess(false); onClose(); }, 1200);
      } else {
        alert('Error al actualizar objetivo');
      }
    } catch { alert('Error de red'); }
    finally { setLoading(false); }
  };

  const pct = Math.min((nuevoTotal / activeGoal.monto_objetivo) * 100, 100);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Actualizar Meta</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {success ? (
          <div className="success-state">
            <div className="success-icon"><Check size={40} color="white" /></div>
            <h3>¡Actualizado!</h3>
            <p>Progreso guardado correctamente.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Nombre objetivo */}
            <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{activeGoal.nombre}</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Meta: {currency}{activeGoal.monto_objetivo.toFixed(2)}
            </p>

            {/* Mini barra de progreso preview */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>Progreso</span><span>{pct.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 0.3s' }}></div>
              </div>
            </div>

            {/* Toggle modo */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button type="button" onClick={() => setMode('abono')} className={`filter-btn ${mode === 'abono' ? 'active' : ''}`} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <PlusCircle size={14} /> Registrar abono
              </button>
              <button type="button" onClick={() => setMode('total')} className={`filter-btn ${mode === 'total' ? 'active' : ''}`} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} /> Establecer total
              </button>
            </div>

            {mode === 'abono' ? (
              <div className="form-group">
                <label>Abono a registrar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{currency}</span>
                  <input type="number" step="0.01" min="0.01" required autoFocus value={abono} onChange={e => setAbono(e.target.value)} style={{ flex: 1 }} placeholder="0.00" />
                </div>
                {abono && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>Nuevo total: {currency}{nuevoTotal.toFixed(2)}</p>}
              </div>
            ) : (
              <div className="form-group">
                <label>Total acumulado a la fecha</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{currency}</span>
                  <input type="number" step="0.01" min="0" required autoFocus value={totalActual} onChange={e => setTotalActual(e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Progreso'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditGoalModal;
