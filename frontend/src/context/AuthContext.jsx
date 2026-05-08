import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('blast_token'));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('blast_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const login = (data) => {
    localStorage.setItem('blast_token', data.token);
    localStorage.setItem('blast_user', JSON.stringify({ uid: data.uid, name: data.name, email: data.email }));
    setToken(data.token);
    setUser({ uid: data.uid, name: data.name, email: data.email });
  };

  const logout = () => {
    localStorage.removeItem('blast_token');
    localStorage.removeItem('blast_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
