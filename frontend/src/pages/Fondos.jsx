import React, { useState } from 'react';
import { Plus, CreditCard, Landmark, Pencil, Trash2, Check, X } from 'lucide-react';
import AddCardModal from '../components/AddCardModal';
import AddAccountModal from '../components/AddAccountModal';

// Modal inline para editar saldo
function EditSaldoModal({ item, tipo, currency, onClose, refreshData }) {
  const [saldo, setSaldo] = useState(item.saldo);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/records/${tipo}/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saldo: Number(saldo) })
      });
      const data = await res.json();
      if (data.success) { refreshData(); onClose(); }
      else alert('Error: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <h2>Editar Saldo</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>{item.nombre} · {item.tipo}</p>
        <div className="form-group">
          <label>{tipo === 'tarjeta' && item.tipo === 'Crédito' ? 'Saldo Adeudado' : 'Saldo Disponible'}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{currency}</span>
            <input type="number" step="0.01" value={saldo} onChange={e => setSaldo(e.target.value)} autoFocus style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', fontSize: '15px', outline: 'none' }} />
          </div>
        </div>
        <button className="submit-btn" onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
}

function FondoCard({ item, tipo, currency, refreshData }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar "${item.nombre}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/records/${tipo}/${item._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) refreshData();
      else alert('Error: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setDeleting(false); }
  };

  const isCreditCard = tipo === 'tarjeta' && item.tipo === 'Crédito';
  const bgClass = tipo === 'tarjeta' ? 'cc-widget' : 'cuenta-widget';

  return (
    <>
      <div className={bgClass} style={{ opacity: deleting ? 0.4 : 1, marginBottom: 0 }}>
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
          <button onClick={() => setEditOpen(true)} style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }} title="Editar saldo">
            <Pencil size={14} />
          </button>
          <button onClick={handleDelete} style={{ background: 'rgba(239,68,68,0.3)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white', display: 'flex' }} title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>

        {tipo === 'tarjeta' && <div className="cc-chip"></div>}
        {tipo === 'cuenta' && <div style={{ marginBottom: '15px', opacity: 0.8, fontSize: '13px' }}><Landmark size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />CUENTA BANCARIA</div>}

        <div className="cc-label">{item.nombre}</div>
        <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px' }}>{item.tipo}</div>
        <div className="cc-balance">
          {isCreditCard ? 'ADEUDO' : 'SALDO'}: {currency}{item.saldo.toFixed(2)}
        </div>

        {tipo === 'tarjeta' && (
          <div className="cc-details">
            <span>{item.fecha_corte ? `Corte: día ${item.fecha_corte}` : 'Sin fecha de corte'}</span>
            <span style={{ opacity: 0.7 }}>{item.tipo}</span>
          </div>
        )}
      </div>

      {editOpen && <EditSaldoModal item={item} tipo={tipo} currency={currency} onClose={() => setEditOpen(false)} refreshData={refreshData} />}
    </>
  );
}

function Fondos({ currency, raw, refreshData }) {
  const [showCardModal, setShowCardModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const tarjetas = raw?.tarjetas || [];
  const cuentas  = raw?.cuentas  || [];

  const totalLiquidez = cuentas.reduce((a, c) => a + c.saldo, 0);
  const totalDeudaTarjetas = tarjetas.filter(t => t.tipo === 'Crédito').reduce((a, t) => a + t.saldo, 0);
  const totalDebito = tarjetas.filter(t => t.tipo === 'Débito').reduce((a, t) => a + t.saldo, 0);

  return (
    <div className="card" style={{ padding: '30px', minHeight: '70vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Gestión de Fondos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>Tus cuentas bancarias y tarjetas en un solo lugar</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="filter-btn" onClick={() => setShowAccountModal(true)} style={{ padding: '8px 14px', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Landmark size={15} /> Cuenta
          </button>
          <button className="filter-btn" onClick={() => setShowCardModal(true)} style={{ padding: '8px 14px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CreditCard size={15} /> Tarjeta
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 20px', flex: 1, minWidth: '140px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Liquidez Total</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>{currency}{totalLiquidez.toFixed(2)}</p>
        </div>
        <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 20px', flex: 1, minWidth: '140px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Deuda en crédito</p>
          <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>{currency}{totalDeudaTarjetas.toFixed(2)}</p>
        </div>
        <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 20px', flex: 1, minWidth: '140px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Saldo débito</p>
          <p style={{ fontSize: '20px', fontWeight: '700' }}>{currency}{totalDebito.toFixed(2)}</p>
        </div>
      </div>

      {/* Cuentas bancarias */}
      <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-muted)' }}>CUENTAS BANCARIAS & EFECTIVO ({cuentas.length})</h4>
      {cuentas.length === 0 ? (
        <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '25px' }}>
          No tienes cuentas registradas. <button onClick={() => setShowAccountModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>Agregar una →</button>
        </div>
      ) : (
        <div className="fondos-grid" style={{ marginBottom: '30px' }}>
          {cuentas.map(c => <FondoCard key={c._id} item={c} tipo="cuenta" currency={currency} refreshData={refreshData} />)}
        </div>
      )}

      {/* Tarjetas */}
      <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-muted)' }}>TARJETAS ({tarjetas.length})</h4>
      {tarjetas.length === 0 ? (
        <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No tienes tarjetas vinculadas. <button onClick={() => setShowCardModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}>Agregar una →</button>
        </div>
      ) : (
        <div className="fondos-grid">
          {tarjetas.map(t => <FondoCard key={t._id} item={t} tipo="tarjeta" currency={currency} refreshData={refreshData} />)}
        </div>
      )}

      <AddCardModal isOpen={showCardModal} onClose={() => setShowCardModal(false)} currency={currency} refreshData={refreshData} />
      <AddAccountModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} currency={currency} refreshData={refreshData} />
    </div>
  );
}

export default Fondos;
