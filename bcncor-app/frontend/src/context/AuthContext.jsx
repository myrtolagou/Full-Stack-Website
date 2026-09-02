import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const MOCK_USER = {
  id: 1,
  name: 'Esade Team',
  email: 'codev@email.com',
  role: 'Admin',
};

const CREDENTIALS = {
  email: 'codev@email.com',
  password: '1234',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login(email, password) {
    if (email !== CREDENTIALS.email || password !== CREDENTIALS.password) {
      throw new Error('Invalid email or password.');
    }
    setUser(MOCK_USER);
    return MOCK_USER;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
