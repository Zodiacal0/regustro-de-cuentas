import React, { useState } from 'react';
import { Plus, Filter, Trash2 } from 'lucide-react';
import AddTransactionModal from '../components/AddTransactionModal';
import { apiFetch } from '../utils/apiFetch';

function Transactions({ currency, transactions, refreshData, raw }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const itemsPerPage = 10;

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'incomes') return !tx.isExpense;
    if (filterType === 'expenses') return tx.isExpense;
    return true;
  });

  const handleFilterChange = (type) => { setFilterType(type); setCurrentPage(1); };

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const handleDelete = async (tx) => {
    if (confirmId !== tx._id) { setConfirmId(tx._id); return; }
    setDeletingId(tx._id);
    setConfirmId(null);
    try {
      const tipo = tx.isExpense ? 'gasto' : 'entrada';
      const res = await apiFetch(`${import.meta.env.VITE_API_URL || ''}/api/records/${tipo}/${tx._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        refreshData();
      } else {
        alert('Error al eliminar: ' + data.message);
      }
    } catch (e) {
      alert('Error de red al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="card" style={{ padding: '30px', minHeight: '83vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Historial Completo</h3>
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button className="filter-btn" onClick={() => setShowFilter(!showFilter)} style={{ padding: '8px 16px', background: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Filter size={16} /> Filtrar
          </button>
          {showFilter && (
            <div style={{ position: 'absolute', top: '45px', right: '110px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, width: '200px' }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '10px' }}>TIPO DE FLUJO</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}><input type="radio" name="fltx" checked={filterType === 'all'} onChange={() => handleFilterChange('all')} /> Todos</label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}><input type="radio" name="fltx" checked={filterType === 'incomes'} onChange={() => handleFilterChange('incomes')} /> Solo Ingresos</label>
                <label style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}><input type="radio" name="fltx" checked={filterType === 'expenses'} onChange={() => handleFilterChange('expenses')} /> Solo Gastos</label>
              </div>
            </div>
          )}
          <button className="filter-btn" onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      <table className="table-lite">
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Flujo</th>
            <th>Fecha</th>
            <th style={{ textAlign: 'right' }}>Monto</th>
            <th style={{ textAlign: 'center', width: '80px' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {displayTransactions.map((tx) => {
            const date = new Date(tx.fecha);
            const isDeleting = deletingId === tx._id;
            const isConfirming = confirmId === tx._id;
            return (
              <tr key={tx._id} style={{ opacity: isDeleting ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                <td data-label="Descripción" style={{ fontWeight: '500' }}>{tx.descripcion}</td>
                <td data-label="Categoría">
                  <span style={{ background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>{tx.categoria}</span>
                </td>
                <td data-label="Flujo" style={{ color: 'var(--text-muted)' }}>{tx.isExpense ? 'Gasto' : 'Ingreso'}</td>
                <td data-label="Fecha" style={{ color: 'var(--text-muted)' }}>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td data-label="Monto" style={{ textAlign: 'right', color: tx.isExpense ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>
                  {tx.isExpense ? '-' : '+'} {currency}{Math.abs(tx.monto).toFixed(2)}
                </td>
                <td data-label="Acción" style={{ textAlign: 'center' }}>
                  {isConfirming ? (
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => handleDelete(tx)} style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>Sí</button>
                      <button onClick={() => setConfirmId(null)} style={{ background: 'var(--border)', color: 'var(--text-main)', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px' }}>No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(tx)}
                      disabled={isDeleting}
                      title="Eliminar registro"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {displayTransactions.length === 0 && (
            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No hay coincidencias con el filtro actual.</td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px', padding: '10px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="filter-btn" style={{ padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}>Anterior</button>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[...Array(Math.min(totalPages, 7))].map((_, i) => (
              <button key={i + 1} onClick={() => goToPage(i + 1)} className={`filter-btn ${currentPage === i + 1 ? 'active' : ''}`} style={{ width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0 }}>{i + 1}</button>
            ))}
          </div>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="filter-btn" style={{ padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}>Siguiente</button>
        </div>
      )}

      <AddTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} currency={currency} refreshData={refreshData} raw={raw} />
    </div>
  );
}

export default Transactions;
