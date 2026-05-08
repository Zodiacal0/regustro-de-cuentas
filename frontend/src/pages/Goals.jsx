import React, { useState } from 'react';
import { Plus, Target, PenSquare, Trash2, Trophy } from 'lucide-react';
import AddGoalModal from '../components/AddGoalModal';
import EditGoalModal from '../components/EditGoalModal';
import { apiFetch } from '../utils/apiFetch';

function Goals({ currency, raw, refreshData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeEditGoal, setActiveEditGoal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const objetivos = raw?.objetivos || [];

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este objetivo?')) return;
    setDeletingId(id);
    try {
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records/objetivo/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) refreshData();
      else alert('Error al eliminar: ' + data.message);
    } catch { alert('Error de red'); }
    finally { setDeletingId(null); }
  };

  const completados = objetivos.filter(o => o.porcentaje_completado >= 100).length;
  const enProgreso  = objetivos.filter(o => o.porcentaje_completado < 100).length;

  return (
    <>
      <div className="card" style={{ padding: '30px', minHeight: '60vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Metas Financieras</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '3px' }}>
              {enProgreso} en progreso · {completados} completadas
            </p>
          </div>
          <button className="filter-btn" onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Nueva Meta
          </button>
        </div>

        {/* Resumen rápido */}
        {objetivos.length > 0 && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '12px 18px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total ahorrado: </span>
              <strong>{currency}{objetivos.reduce((a, o) => a + o.monto_actual, 0).toFixed(2)}</strong>
            </div>
            <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '12px 18px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Meta total: </span>
              <strong>{currency}{objetivos.reduce((a, o) => a + o.monto_objetivo, 0).toFixed(2)}</strong>
            </div>
          </div>
        )}

        {/* Grid de objetivos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {objetivos.map(obj => {
            const pct = Math.min(obj.porcentaje_completado, 100);
            const done = pct >= 100;
            return (
              <div key={obj._id} className="goal-card" style={{ opacity: deletingId === obj._id ? 0.4 : 1 }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {done ? <Trophy size={18} color="#f59e0b" /> : <Target size={18} color="var(--primary)" />}
                    <h4 style={{ fontWeight: '600', fontSize: '15px', lineHeight: 1.3 }}>{obj.nombre}</h4>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setActiveEditGoal(obj)} className="icon-action-btn" title="Actualizar progreso">
                      <PenSquare size={14} />
                    </button>
                    <button onClick={() => handleDelete(obj._id)} className="icon-action-btn danger" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  <span>{done ? '¡Meta alcanzada!' : 'Progreso'}</span>
                  <span style={{ fontWeight: '700', color: done ? '#f59e0b' : 'var(--primary)' }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: done ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'var(--primary)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                </div>

                {/* Montos */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Acumulado</p>
                    <p style={{ fontWeight: '600', fontSize: '15px' }}>{currency}{obj.monto_actual.toFixed(2)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Meta</p>
                    <p style={{ fontWeight: '600', fontSize: '15px' }}>{currency}{obj.monto_objetivo.toFixed(2)}</p>
                  </div>
                </div>

                {/* Falta */}
                {!done && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                    Faltan {currency}{(obj.monto_objetivo - obj.monto_actual).toFixed(2)}
                  </p>
                )}
              </div>
            );
          })}
          {objetivos.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Target size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>No tienes metas financieras.</p>
              <p style={{ fontSize: '13px' }}>Crea una para empezar a ahorrar con propósito.</p>
            </div>
          )}
        </div>
      </div>

      <AddGoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currency={currency} refreshData={refreshData} />
      <EditGoalModal isOpen={!!activeEditGoal} onClose={() => setActiveEditGoal(null)} currency={currency} refreshData={refreshData} activeGoal={activeEditGoal} />
    </>
  );
}

export default Goals;
