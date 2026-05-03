import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Analytics({ currency, transactions }) {
  const [timeFilter, setTimeFilter] = React.useState('Mensual'); // Diario | Semanal | Mensual

  // Agrumiento por categoria (gastos totales)
  const dataMap = {};
  transactions.filter(t => t.isExpense).forEach(t => {
    dataMap[t.categoria] = (dataMap[t.categoria] || 0) + t.monto;
  });

  const categoryData = Object.keys(dataMap).map(k => ({ name: k, qty: dataMap[k] }));

  // Agrupamiento Temporal (Diario/Semanal/Mensual)
  const timeData = React.useMemo(() => {
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

      if (!map[key]) map[key] = { name: key, Ingreso: 0, Gasto: 0 };
      if (tx.isExpense) map[key].Gasto += tx.monto;
      else map[key].Ingreso += tx.monto;
    });
    return Object.values(map);
  }, [transactions, timeFilter]);

  // Metricas rápidas
  const expenses = transactions.filter(t => t.isExpense).map(t => t.monto);
  const mayorGasto = expenses.length > 0 ? Math.max(...expenses) : 0;
  const promedio = expenses.length > 0 ? (expenses.reduce((a, b) => a + b, 0) / expenses.length) : 0;

  return (
    <div className="card" style={{ padding: '30px', minHeight: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Flujo Histórico de Caja</h3>
        <div className="chart-filters">
          <button className={`filter-btn ${timeFilter === 'Diario' ? 'active' : ''}`} onClick={() => setTimeFilter('Diario')}>Diario</button>
          <button className={`filter-btn ${timeFilter === 'Semanal' ? 'active' : ''}`} onClick={() => setTimeFilter('Semanal')}>Semanal</button>
          <button className={`filter-btn ${timeFilter === 'Mensual' ? 'active' : ''}`} onClick={() => setTimeFilter('Mensual')}>Mensual</button>
        </div>
      </div>
      <div className="analytics-chart-main" style={{ marginBottom: '40px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timeData}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="Ingreso" fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Gasto" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '25px' }}>Gastos por Categoría (Total)</h3>
      <div className="analytics-chart-category">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="qty" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="analytics-metrics-row" style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
        <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Promedio Diario</p>
          <h4 style={{ fontSize: '24px' }}>{currency}{promedio.toFixed(2)}</h4>
        </div>
        <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg-main)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Mayor Gasto Registrado</p>
          <h4 style={{ fontSize: '24px' }}>{currency}{mayorGasto.toFixed(2)}</h4>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
