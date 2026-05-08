import React, { useState } from 'react';
import { Plus, Wallet, Trash2, PenSquare, X, Check, PlusCircle, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

// ---------- Modal Agregar Deuda ----------
function AddDebtModal({ isOpen, onClose, currency, refreshData }) {
  const [form, setForm] = useState({ nombre: '', acreedor: '', monto_total: '', monto_pagado: '0', notas: '', fecha_vencimiento: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records`, {
        method: 'POST',
        
        body: JSON.stringify({
          tipo_registro: 'deuda',
          payload: {
            nombre: form.nombre,
            acreedor: form.acreedor || undefined,
            monto_total: Number(form.monto_total),
            monto_pagado: Number(form.monto_pagado || 0),
            notas: form.notas || undefined,
            fecha_vencimiento: form.fecha_vencimiento || undefined
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        refreshData();
        setTimeout(() => { setSuccess(false); setForm({ nombre: '', acreedor: '', monto_total: '', monto_pagado: '0', notas: '', fecha_vencimiento: '' }); onClose(); }, 1200);
      } else alert('Error: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nueva Deuda</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        {success ? (
          <div className="success-state"><div className="success-icon"><Check size={40} color="white" /></div><h3>¡Registrada!</h3><p>Deuda añadida al seguimiento.</p></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre / Concepto</label>
              <input type="text" required placeholder="Ej. Préstamo auto, Tarjeta HSBC..." value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Acreedor (opcional)</label>
                <input type="text" placeholder="Ej. Banco, Persona..." value={form.acreedor} onChange={e => setForm({...form, acreedor: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Vencimiento (opcional)</label>
                <input type="date" value={form.fecha_vencimiento} onChange={e => setForm({...form, fecha_vencimiento: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Monto Total</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{currency}</span>
                  <input type="number" step="0.01" required min="0.01" style={{ flex: 1 }} value={form.monto_total} onChange={e => setForm({...form, monto_total: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Ya pagado</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{currency}</span>
                  <input type="number" step="0.01" min="0" style={{ flex: 1 }} value={form.monto_pagado} onChange={e => setForm({...form, monto_pagado: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Notas (opcional)</label>
              <input type="text" placeholder="Tasa, cuotas, observaciones..." value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Guardando...' : 'Registrar Deuda'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- Modal Pagar / Actualizar Deuda ----------
function EditDebtModal({ isOpen, onClose, deuda, currency, refreshData }) {
  const [mode, setMode] = useState('pago');
  const [pago, setPago] = useState('');
  const [totalPagado, setTotalPagado] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (deuda) { setTotalPagado(deuda.monto_pagado); setPago(''); setMode('pago'); }
  }, [deuda]);

  if (!isOpen || !deuda) return null;

  const nuevoTotal = mode === 'pago'
    ? deuda.monto_pagado + Number(pago || 0)
    : Number(totalPagado || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records/deuda/${deuda._id}`, {
        method: 'PUT',
        
        body: JSON.stringify({ monto_pagado: nuevoTotal })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        refreshData();
        setTimeout(() => { setSuccess(false); onClose(); }, 1200);
      } else alert('Error: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setLoading(false); }
  };

  const pct = Math.min((nuevoTotal / deuda.monto_total) * 100, 100);
  const color = pct < 33 ? 'var(--danger)' : pct < 70 ? '#f59e0b' : 'var(--success)';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Actualizar Deuda</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        {success ? (
          <div className="success-state"><div className="success-icon"><Check size={40} color="white" /></div><h3>¡Actualizado!</h3></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>{deuda.nombre}</p>
            {deuda.acreedor && <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Acreedor: {deuda.acreedor}</p>}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>Pagado</span><span style={{ fontWeight: '700', color }}>{pct.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.3s' }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button type="button" onClick={() => setMode('pago')} className={`filter-btn ${mode === 'pago' ? 'active' : ''}`} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <PlusCircle size={14} /> Registrar pago
              </button>
              <button type="button" onClick={() => setMode('total')} className={`filter-btn ${mode === 'total' ? 'active' : ''}`} style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <SlidersHorizontal size={14} /> Establecer total
              </button>
            </div>
            {mode === 'pago' ? (
              <div className="form-group">
                <label>Monto del pago</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{currency}</span>
                  <input type="number" step="0.01" min="0.01" required autoFocus style={{ flex: 1 }} value={pago} onChange={e => setPago(e.target.value)} placeholder="0.00" />
                </div>
                {pago && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>Total pagado: {currency}{nuevoTotal.toFixed(2)} de {currency}{deuda.monto_total.toFixed(2)}</p>}
              </div>
            ) : (
              <div className="form-group">
                <label>Total pagado a la fecha</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{currency}</span>
                  <input type="number" step="0.01" min="0" required autoFocus style={{ flex: 1 }} value={totalPagado} onChange={e => setTotalPagado(e.target.value)} />
                </div>
              </div>
            )}
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------- Página Principal ----------
function Deudas({ currency, raw, refreshData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editDeuda, setEditDeuda] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const deudas = raw?.deudas || [];

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta deuda?')) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records/deuda/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) refreshData();
      else alert('Error: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setDeletingId(null); }
  };

  const totalDeuda = deudas.reduce((a, d) => a + d.monto_total, 0);
  const totalPagado = deudas.reduce((a, d) => a + d.monto_pagado, 0);
  const deudaActiva = deudas.filter(d => d.porcentaje_pagado < 100);
  const deudaSaldada = deudas.filter(d => d.porcentaje_pagado >= 100);

  return (
    <>
      <div className="card" style={{ padding: '30px', minHeight: '60vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Control de Deudas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
              {deudaActiva.length} activas · {deudaSaldada.length} saldadas
            </p>
          </div>
          <button className="filter-btn" onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Nueva Deuda
          </button>
        </div>

        {/* Resumen */}
        {deudas.length > 0 && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '14px 20px', flex: 1, minWidth: '140px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deuda total</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>{currency}{totalDeuda.toFixed(2)}</p>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '14px 20px', flex: 1, minWidth: '140px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total pagado</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>{currency}{totalPagado.toFixed(2)}</p>
            </div>
            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 20px', flex: 1, minWidth: '140px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pendiente</p>
              <p style={{ fontSize: '20px', fontWeight: '700' }}>{currency}{(totalDeuda - totalPagado).toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Deudas activas */}
        {deudaActiva.length > 0 && (
          <>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>EN CURSO ({deudaActiva.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {deudaActiva.map(d => <DeudaCard key={d._id} d={d} currency={currency} onEdit={() => setEditDeuda(d)} onDelete={() => handleDelete(d._id)} deleting={deletingId === d._id} />)}
            </div>
          </>
        )}

        {/* Deudas saldadas */}
        {deudaSaldada.length > 0 && (
          <>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>SALDADAS ✓ ({deudaSaldada.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {deudaSaldada.map(d => <DeudaCard key={d._id} d={d} currency={currency} onEdit={() => setEditDeuda(d)} onDelete={() => handleDelete(d._id)} deleting={deletingId === d._id} />)}
            </div>
          </>
        )}

        {deudas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <Wallet size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No tienes deudas registradas.</p>
            <p style={{ fontSize: '13px' }}>¡Eso es una excelente noticia! Si tienes alguna, agrégala para darle seguimiento.</p>
          </div>
        )}
      </div>

      <AddDebtModal isOpen={showAdd} onClose={() => setShowAdd(false)} currency={currency} refreshData={refreshData} />
      <EditDebtModal isOpen={!!editDeuda} onClose={() => setEditDeuda(null)} deuda={editDeuda} currency={currency} refreshData={refreshData} />
    </>
  );
}

function DeudaCard({ d, currency, onEdit, onDelete, deleting }) {
  const pct = Math.min(d.porcentaje_pagado, 100);
  const done = pct >= 100;
  const color = done ? 'var(--success)' : pct < 33 ? 'var(--danger)' : pct < 70 ? '#f59e0b' : '#22c55e';
  const isVencida = d.fecha_vencimiento && new Date(d.fecha_vencimiento) < new Date() && !done;

  return (
    <div className="goal-card" style={{ opacity: deleting ? 0.4 : 1, borderLeft: done ? '3px solid var(--success)' : isVencida ? '3px solid var(--danger)' : '3px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h4 style={{ fontWeight: '600', fontSize: '15px' }}>{d.nombre}</h4>
          {d.acreedor && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{d.acreedor}</p>}
          {isVencida && <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}><AlertCircle size={11} /> Vencida</span>}
          {d.fecha_vencimiento && !isVencida && !done && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Vence: {new Date(d.fecha_vencimiento).toLocaleDateString()}</p>}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {!done && <button onClick={onEdit} className="icon-action-btn" title="Registrar pago"><PenSquare size={14} /></button>}
          <button onClick={onDelete} className="icon-action-btn danger" title="Eliminar"><Trash2 size={14} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
        <span>{done ? '¡Saldada!' : 'Pagado'}</span>
        <span style={{ fontWeight: '700', color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ width: '100%', height: '7px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Pagado</p>
          <p style={{ fontWeight: '600', fontSize: '15px', color: 'var(--success)' }}>{currency}{d.monto_pagado.toFixed(2)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total</p>
          <p style={{ fontWeight: '600', fontSize: '15px' }}>{currency}{d.monto_total.toFixed(2)}</p>
        </div>
      </div>

      {!done && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
          Pendiente: {currency}{(d.monto_total - d.monto_pagado).toFixed(2)}
        </p>
      )}

      {d.notas && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>{d.notas}</p>}
    </div>
  );
}

export default Deudas;
