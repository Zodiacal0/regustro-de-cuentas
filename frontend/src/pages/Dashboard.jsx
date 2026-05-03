import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, CreditCard, Plus, ArrowLeftRight, Landmark } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import AddCardModal from '../components/AddCardModal';
import AddTransactionModal from '../components/AddTransactionModal';
import AddAccountModal from '../components/AddAccountModal';

function Dashboard({ currency, raw, transactions, refreshData }) {
  const [activeChart, setActiveChart] = useState('line');
  const [timeFilter, setTimeFilter] = useState('Mensual'); // Diario | Semanal | Mensual
  const [chartAnim, setChartAnim] = useState('');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Sistema de Tarjetas (Switch animado)
  const [cardIndex, setCardIndex] = useState(0);
  const [cardAnim, setCardAnim] = useState('');
  const userCards = (raw.tarjetas && raw.tarjetas.length > 0) ? raw.tarjetas : null;

  const nextCard = () => {
    if (userCards) {
      setCardAnim('');
      setTimeout(() => {
          setCardIndex((prev) => (prev + 1) % userCards.length);
          setCardAnim('widget-anim-enter');
      }, 10);
    }
  };
  const handleCardSelect = (idx) => {
      setCardAnim('');
      setTimeout(() => {
          setCardIndex(idx);
          setCardAnim('widget-anim-enter');
      }, 10);
  };
  const currentCard = userCards ? userCards[cardIndex] : null;

  // Sistema de Cuentas (Switch animado)
  const [cuentaIndex, setCuentaIndex] = useState(0);
  const [cuentaAnim, setCuentaAnim] = useState('');
  const userCuentas = (raw.cuentas && raw.cuentas.length > 0) ? raw.cuentas : null;

  const nextCuenta = () => {
    if (userCuentas) {
      setCuentaAnim('');
      setTimeout(() => {
          setCuentaIndex((prev) => (prev + 1) % userCuentas.length);
          setCuentaAnim('widget-anim-enter');
      }, 10);
    }
  };
  const handleCuentaSelect = (idx) => {
      setCuentaAnim('');
      setTimeout(() => {
          setCuentaIndex(idx);
          setCuentaAnim('widget-anim-enter');
      }, 10);
  };
  const currentCuenta = userCuentas ? userCuentas[cuentaIndex] : null;

  const handleTimeFilterChange = (filter) => {
    setChartAnim('');
    setTimeout(() => {
      setTimeFilter(filter);
      setChartAnim('widget-anim-enter');
    }, 10);
  };

  // Cálculos Dinámicos
  const totalIngresos = raw.entradas.reduce((acc, sum) => acc + sum.monto, 0);
  const totalGastos = raw.gastos.reduce((acc, sum) => acc + sum.monto, 0);
  const balanceTotal = totalIngresos - totalGastos;

  // Preparar Data Dinámica para Recharts
  const chartData = useMemo(() => {
    const map = {};
    const getWeek = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 4 - (d.getDay() || 7));
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `Sem ${weekNo}`;
    };

    transactions.forEach(tx => {
      const d = new Date(tx.fecha);
      let key = '';
      if (timeFilter === 'Mensual') {
        key = d.toLocaleString('es-ES', { month: 'short' });
      } else if (timeFilter === 'Semanal') {
        key = getWeek(d);
      } else {
        key = d.getDate() + ' ' + d.toLocaleString('es-ES', { month: 'short' });
      }

      if (!map[key]) map[key] = { name: key, income: 0, expense: 0 };
      if (tx.isExpense) map[key].expense += tx.monto;
      else map[key].income += tx.monto;
    });
    return Object.values(map);
  }, [transactions, timeFilter]);

  // Preparar Data Dinámica para Composición (Gastos por Categoría)
  const pieData = useMemo(() => {
    const catMap = {};
    raw.gastos.forEach(g => {
      const c = g.categoria || 'Otros';
      catMap[c] = (catMap[c] || 0) + g.monto;
    });
    return Object.keys(catMap).map(k => ({ name: k, value: catMap[k] }));
  }, [raw.gastos]);

  const COLORS = ['#4e7361', '#6a957e', '#9bc2ab', '#a5b4fc', '#f59e0b', '#ef4444'];

  return (
    <>
      {/* TOP KPI CARDS */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="kpi-title">
            Gastos Totales
            <ArrowDownRight size={16} color="var(--danger)" />
          </div>
          <div className="kpi-value" style={{color: 'var(--text-main)'}}>{currency}{totalGastos.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">
            Ingresos Totales
            <ArrowUpRight size={16} color="var(--success)" />
          </div>
          <div className="kpi-value" style={{color: 'var(--text-main)'}}>{currency}{totalIngresos.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Balance Actual</div>
          <div className="kpi-value">{currency}{balanceTotal.toFixed(2)}</div>
          <div style={{color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px'}}>Neto Acumulado</div>
        </div>
        <div className="card card-dark">
          <div className="kpi-title">
            Objetivo Activo
            <span>{raw.objetivos.length > 0 ? raw.objetivos[0].nombre : 'Sin Objetivos'}</span>
          </div>
          <div className="kpi-value">{currency}{raw.objetivos.length > 0 ? raw.objetivos[0].monto_actual : 0}</div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="charts-grid">
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3 style={{fontSize: '18px', fontWeight: '600'}}>Análisis de Balance</h3>
              <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>Histórico basado en registros</p>
            </div>
            
            <div className="chart-controls">
              <div className="chart-filters">
                <button className={`filter-btn ${timeFilter === 'Diario' ? 'active' : ''}`} onClick={() => handleTimeFilterChange('Diario')}>Día</button>
                <button className={`filter-btn ${timeFilter === 'Semanal' ? 'active' : ''}`} onClick={() => handleTimeFilterChange('Semanal')}>Semana</button>
                <button className={`filter-btn ${timeFilter === 'Mensual' ? 'active' : ''}`} onClick={() => handleTimeFilterChange('Mensual')}>Mes</button>
              </div>
              <div style={{ width: '1px', background: 'var(--border)', margin: '0 5px' }}></div>
              <div className="chart-filters">
                <button className={`filter-btn ${activeChart === 'line' ? 'active' : ''}`} onClick={() => setActiveChart('line')}>Línea</button>
                <button className={`filter-btn ${activeChart === 'bar' ? 'active' : ''}`} onClick={() => setActiveChart('bar')}>Barra</button>
              </div>
            </div>
          </div>
          
          <div className={chartAnim} style={{flex: 1, width: '100%', height: '100%', minHeight: '250px'}}>
            {chartData.length === 0 ? (
               <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>Sin datos suficientes</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChart === 'line' ? (
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                      <Tooltip cursor={{stroke: '#e5e7eb', strokeWidth: 1}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                      <Line type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={3} dot={true} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={true} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                      <Bar dataKey="income" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card chart-card">
            <div className="chart-header">
            <div>
              <h3 style={{fontSize: '18px', fontWeight: '600'}}>Composición</h3>
              <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>Gastos según API</p>
            </div>
          </div>
          <div style={{flex: 1, width: '100%', height: '100%', minHeight: '200px'}}>
            {pieData.length === 0 ? (
               <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>Sin gastos a categorizar</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM WIDGETS */}
      <div className="widgets-grid">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{fontSize: '18px', fontWeight: '600'}}>Cuentas & Movimientos</h3>
              <button 
                className="filter-btn" 
                onClick={() => setIsTxModalOpen(true)}
                style={{ background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px'}}
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
            
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              <table className="table-lite">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th>Fecha</th>
                    <th style={{textAlign: 'right'}}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((tx, idx) => {
                    const date = new Date(tx.fecha);
                    return (
                      <tr key={idx}>
                        <td data-label="Descripción" style={{fontWeight: '500'}}>{tx.descripcion}</td>
                        <td data-label="Categoría">{tx.categoria}</td>
                        <td data-label="Fecha" style={{color: 'var(--text-muted)'}}>{date.toLocaleDateString()}</td>
                        <td data-label="Monto" style={{textAlign: 'right', color: tx.isExpense ? 'var(--danger)' : 'var(--success)', fontWeight: '500'}}>
                          {tx.isExpense ? '-' : '+'} {currency}{tx.monto.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                  {transactions.length === 0 && (
                    <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--text-muted)'}}>No hay transacciones guardadas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            {/* WIDGET CUENTAS */}
            {!currentCuenta ? (
                <div className="cuenta-widget" style={{ minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{opacity: 0.8}}>No tienes cuentas bancarias</p>
                </div>
            ) : (
                <div className={`cuenta-widget ${cuentaAnim}`}>
                  {userCuentas.length > 1 && (
                     <div style={{position: 'absolute', top: '15px', right: '15px'}}>
                       <select 
                         value={cuentaIndex} 
                         onChange={(e) => handleCuentaSelect(Number(e.target.value))}
                         style={{background: 'rgba(255,255,255,0.9)', border: 'none', color: 'var(--text-main)', borderRadius: '15px', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', outline: 'none', appearance: 'none', fontWeight: '500'}}
                       >
                           {userCuentas.map((c, idx) => (
                               <option key={c._id} value={idx}>{c.nombre}</option>
                           ))}
                       </select>
                     </div>
                  )}

                  <div className="cc-label" style={{opacity: 1, fontSize: '14px', marginBottom: '15px'}}><Landmark size={20} style={{display: 'inline', verticalAlign: 'middle', marginRight: '5px'}} /> LIQUIDEZ Y BANCOS</div>
                  <div className="cc-label">{currentCuenta.nombre} • {currentCuenta.tipo}</div>
                  <div className="cc-balance">SALDO: {currency}{currentCuenta.saldo.toFixed(2)}</div>
                </div>
            )}
            
            <button className="btn-add-card" onClick={() => setIsAccountModalOpen(true)} style={{marginBottom: '25px'}}>
              <Landmark size={18} />
              Agregar Cuenta
            </button>

            {/* WIDGET TARJETAS */}
            {!currentCard ? (
                <div className="cc-widget" style={{ minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{opacity: 0.8}}>No tienes tarjetas vinculadas</p>
                </div>
            ) : (
                <div className={`cc-widget ${cardAnim}`}>
                  {userCards.length > 1 && (
                     <div style={{position: 'absolute', top: '15px', right: '15px'}}>
                       <select 
                         value={cardIndex} 
                         onChange={(e) => handleCardSelect(Number(e.target.value))}
                         style={{background: 'rgba(255,255,255,0.9)', border: 'none', color: 'var(--text-main)', borderRadius: '15px', cursor: 'pointer', padding: '6px 12px', fontSize: '12px', outline: 'none', appearance: 'none', fontWeight: '500'}}
                       >
                           {userCards.map((c, idx) => (
                               <option key={c._id} value={idx}>{c.nombre}</option>
                           ))}
                       </select>
                     </div>
                  )}

                  <div className="cc-chip"></div>
                  <div className="cc-label">{currentCard.nombre} • {currentCard.tipo}</div>
                  <div className="cc-balance">{currentCard.tipo === 'Crédito' ? 'ADEUDO' : 'SALDO'}: {currency}{currentCard.saldo.toFixed(2)}</div>
                  <div className="cc-details">
                    <span>{currentCard.fecha_corte ? `Corte: ${currentCard.fecha_corte} del mes` : 'Al Contado'}</span>
                  </div>
                </div>
            )}
            
            <button className="btn-add-card" onClick={() => setIsCardModalOpen(true)}>
              <CreditCard size={18} />
              Agregar Tarjeta
            </button>
          </div>
      </div>

      <AddAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} currency={currency} refreshData={refreshData} />
      <AddCardModal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} currency={currency} refreshData={refreshData} />
      <AddTransactionModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} currency={currency} refreshData={refreshData} raw={raw} />
    </>
  );
}

export default Dashboard;
