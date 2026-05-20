import React, { useState } from 'react';
import { Plus, PenSquare, Trash2, Utensils, Car, Zap, Film, Heart, BookOpen, Shirt, Package, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import AddBudgetModal from '../components/AddBudgetModal';
import { apiFetch } from '../utils/apiFetch';

const CATEGORIA_ICONS = {
  'Alimentación':    <Utensils size={16} />,
  'Transporte':      <Car size={16} />,
  'Servicios':       <Zap size={16} />,
  'Entretenimiento': <Film size={16} />,
  'Salud':           <Heart size={16} />,
  'Educación':       <BookOpen size={16} />,
  'Ropa':            <Shirt size={16} />,
  'Otros':           <Package size={16} />,
};

const PERIODO_LABELS = {
  mensual:      'Este Mes',
  semanal:      'Esta Semana',
  quincenal:    'Esta Quincena',
  anual:        'Este Año',
  personalizado: 'Rango personalizado',
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

function getPeriodRange(periodo) {
  const now = new Date();
  switch (periodo) {
    case 'semanal': {
      const day = now.getDay();
      const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'quincenal': {
      const d = now.getDate();
      if (d <= 15) return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999) };
      return { start: new Date(now.getFullYear(), now.getMonth(), 16), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
    }
    case 'anual':
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999) };
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
  }
}

function getPeriodRangeForBudget(budget) {
  if (budget.periodo === 'personalizado') {
    return {
      start: new Date(budget.fecha_inicio + 'T00:00:00'),
      end: new Date(budget.fecha_fin + 'T23:59:59.999'),
    };
  }
  return getPeriodRange(budget.periodo);
}

function getPrevPeriodRange(periodo) {
  const now = new Date();
  switch (periodo) {
    case 'semanal': {
      const day = now.getDay();
      const thisStart = new Date(now); thisStart.setDate(now.getDate() - day); thisStart.setHours(0, 0, 0, 0);
      const end = new Date(thisStart); end.setDate(thisStart.getDate() - 1); end.setHours(23, 59, 59, 999);
      const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'quincenal': {
      const d = now.getDate();
      if (d <= 15) {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { start: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 16), end: new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59, 999) };
      }
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999) };
    }
    case 'anual':
      return { start: new Date(now.getFullYear() - 1, 0, 1), end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999) };
    default: {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: s, end: new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59, 59, 999) };
    }
  }
}

function getGastado(budget, gastos, range) {
  const { start, end } = range || getPeriodRangeForBudget(budget);
  return gastos.filter(g => {
    const f = new Date(g.fecha);
    return g.categoria === budget.categoria && f >= start && f <= end;
  }).reduce((s, g) => s + g.monto, 0);
}

function getEfectiveLimite(budget, gastos) {
  if (!budget.rollover || budget.periodo === 'personalizado') return budget.monto_limite;
  const prevGastado = getGastado(budget, gastos, getPrevPeriodRange(budget.periodo));
  const prevUnused = Math.max(0, budget.monto_limite - prevGastado);
  return budget.monto_limite + prevUnused;
}

function getProyeccion(budget, gastos) {
  if (budget.periodo === 'personalizado') return null;
  const now = new Date();
  const { start, end } = getPeriodRangeForBudget(budget);
  const totalDays = (end - start) / 86400000 + 1;
  const daysPassed = Math.max(1, (now - start) / 86400000);
  const gastado = getGastado(budget, gastos);
  return (gastado / daysPassed) * totalDays;
}

function getStatus(pct) {
  if (pct >= 100) return { label: 'Excedido', color: '#ef4444', bg: '#fef2f2' };
  if (pct >= 90)  return { label: 'En Límite', color: '#f97316', bg: '#fff7ed' };
  if (pct >= 70)  return { label: '¡Atención!', color: '#f59e0b', bg: '#fffbeb' };
  return { label: 'En Control', color: '#10b981', bg: '#f0fdf4' };
}

function BudgetCard({ budget, gastos, currency, onEdit, onDelete, deletingId }) {
  const efectiveLimite = getEfectiveLimite(budget, gastos);
  const gastado = getGastado(budget, gastos);
  const restante = efectiveLimite - gastado;
  const pct = Math.min((gastado / efectiveLimite) * 100, 100);
  const proyeccion = getProyeccion(budget, gastos);
  const status = getStatus(pct);
  const icon = CATEGORIA_ICONS[budget.categoria] || <Package size={16} />;
  const isDeleting = deletingId === budget._id;
  const isPersonalizado = budget.periodo === 'personalizado';
  const periodoLabel = isPersonalizado
    ? `${fmtDate(budget.fecha_inicio)} – ${fmtDate(budget.fecha_fin)}`
    : PERIODO_LABELS[budget.periodo];

  const barColor = pct >= 100 ? '#ef4444' : pct >= 90 ? '#f97316' : pct >= 70 ? '#f59e0b' : budget.color;

  return (
    <div className="budget-card" style={{ opacity: isDeleting ? 0.4 : 1, borderTop: `4px solid ${budget.color}` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: budget.color + '20', color: budget.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <div>
            <p style={{ fontWeight: '600', fontSize: '14px', lineHeight: 1.2 }}>{budget.nombre}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{budget.categoria}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onEdit(budget)} className="icon-action-btn" title="Editar"><PenSquare size={13} /></button>
            <button onClick={() => onDelete(budget._id)} className="icon-action-btn danger" title="Eliminar" disabled={isDeleting}><Trash2 size={13} /></button>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '20px', background: status.bg, color: status.color }}>{status.label}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
          <span>{periodoLabel}</span>
          <span style={{ fontWeight: '700', color: barColor }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Amounts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Gastado</p>
          <p style={{ fontWeight: '700', fontSize: '15px', color: barColor }}>{currency}{gastado.toFixed(2)}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Límite</p>
          <p style={{ fontWeight: '600', fontSize: '15px' }}>{currency}{efectiveLimite.toFixed(2)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>{restante >= 0 ? 'Disponible' : 'Exceso'}</p>
          <p style={{ fontWeight: '700', fontSize: '15px', color: restante >= 0 ? '#10b981' : '#ef4444' }}>{currency}{Math.abs(restante).toFixed(2)}</p>
        </div>
      </div>

      {/* Footer: proyección + rollover */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
        {proyeccion !== null ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            {proyeccion > efectiveLimite
              ? <TrendingUp size={12} color="#ef4444" />
              : <TrendingDown size={12} color="#10b981" />}
            <span>Proyección: <strong style={{ color: proyeccion > efectiveLimite ? '#ef4444' : '#10b981' }}>{currency}{proyeccion.toFixed(2)}</strong></span>
          </div>
        ) : (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Período único</div>
        )}
        {budget.rollover && !isPersonalizado && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--primary)', fontWeight: '600' }}>
            <RefreshCw size={10} /> Rollover
          </div>
        )}
      </div>
    </div>
  );
}

function Presupuesto({ currency, raw, refreshData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const gastos = raw?.gastos || [];
  const presupuestos = raw?.presupuestos || [];

  const handleEdit = (budget) => { setEditBudget(budget); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setEditBudget(null); };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records/presupuesto/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) refreshData();
      else alert('Error: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setDeletingId(null); }
  };

  // Calcular resumen global
  const resumen = presupuestos.reduce((acc, b) => {
    const limite = getEfectiveLimite(b, gastos);
    const gastado = getGastado(b, gastos);
    acc.totalLimite += limite;
    acc.totalGastado += gastado;
    const pct = (gastado / limite) * 100;
    if (pct >= 100) acc.excedidos++;
    else if (pct >= 70) acc.alertas++;
    return acc;
  }, { totalLimite: 0, totalGastado: 0, excedidos: 0, alertas: 0 });

  const saludPct = resumen.totalLimite > 0
    ? Math.max(0, ((resumen.totalLimite - resumen.totalGastado) / resumen.totalLimite) * 100)
    : 100;

  const excedidos = presupuestos.filter(b => {
    const limite = getEfectiveLimite(b, gastos);
    return getGastado(b, gastos) >= limite;
  });

  return (
    <>
      <div className="card" style={{ padding: '30px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Presupuestos</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
              {presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''} · {resumen.excedidos} excedido{resumen.excedidos !== 1 ? 's' : ''} · {resumen.alertas} en atención
            </p>
          </div>
          <button className="filter-btn" onClick={() => setModalOpen(true)}
            style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Nuevo Presupuesto
          </button>
        </div>

        {/* Resumen stats */}
        {presupuestos.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Presupuestado</p>
                <p style={{ fontSize: '18px', fontWeight: '700' }}>{currency}{resumen.totalLimite.toFixed(2)}</p>
              </div>
              <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Gastado</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger)' }}>{currency}{resumen.totalGastado.toFixed(2)}</p>
              </div>
              <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Disponible</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success)' }}>{currency}{Math.max(0, resumen.totalLimite - resumen.totalGastado).toFixed(2)}</p>
              </div>
              <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Salud Financiera</p>
                <p style={{ fontSize: '18px', fontWeight: '700', color: saludPct >= 50 ? '#10b981' : '#ef4444' }}>{saludPct.toFixed(0)}%</p>
              </div>
            </div>

            {/* Barra de salud global */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>Uso global del presupuesto</span>
                <span>{((resumen.totalGastado / resumen.totalLimite) * 100).toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((resumen.totalGastado / resumen.totalLimite) * 100, 100)}%`,
                  height: '100%',
                  borderRadius: '5px',
                  background: saludPct >= 50 ? 'linear-gradient(90deg, #10b981, #3a5849)' : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Alertas */}
            {excedidos.length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontWeight: '600', fontSize: '13px', color: '#dc2626' }}>
                    {excedidos.length} presupuesto{excedidos.length > 1 ? 's' : ''} excedido{excedidos.length > 1 ? 's' : ''}
                  </p>
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '2px' }}>
                    {excedidos.map(b => b.nombre).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {resumen.excedidos === 0 && resumen.alertas === 0 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <CheckCircle size={18} color="#10b981" />
                <p style={{ fontWeight: '500', fontSize: '13px', color: '#16a34a' }}>Todos tus presupuestos están bajo control</p>
              </div>
            )}
          </>
        )}

        {/* Grid de tarjetas */}
        {presupuestos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📊</div>
            <p style={{ fontWeight: '500', marginBottom: '6px' }}>Sin presupuestos aún</p>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>Crea un presupuesto por categoría para tomar control de tus gastos.</p>
            <button className="filter-btn" onClick={() => setModalOpen(true)}
              style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Crear mi primer presupuesto
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
            {presupuestos.map(b => (
              <BudgetCard
                key={b._id}
                budget={b}
                gastos={gastos}
                currency={currency}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>

      <AddBudgetModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        currency={currency}
        refreshData={refreshData}
        editBudget={editBudget}
      />
    </>
  );
}

export default Presupuesto;
