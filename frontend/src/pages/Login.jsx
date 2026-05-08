import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        login(data.data);
        navigate('/');
      } else {
        setError(data.message);
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Activity size={30} color="var(--primary)" />
          <span>Numera<span className="auth-logo-dot">.</span></span>
        </div>

        <h2 className="auth-title">Bienvenido de vuelta</h2>
        <p className="auth-subtitle">Ingresa a tu cuenta para continuar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <Mail size={16} className="auth-input-icon" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <Lock size={16} className="auth-input-icon" />
            <input
              type="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Iniciando sesión...' : (
              <><span>Iniciar Sesión</span><ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
