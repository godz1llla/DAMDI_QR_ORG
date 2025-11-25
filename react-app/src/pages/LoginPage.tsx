import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: loginAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginAuth(email, password);
      if (response.redirect) {
        window.location.href = response.redirect;
      } else {
        navigate('/dashboard/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка входа');
      setLoading(false);
    }
  };


  return (
    <div className="login-page">
      <main className="login-wrapper">
        <header className="header">
          <div className="logo">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2 2h2v2H2V2Z"/>
              <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z"/>
              <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z"/>
              <path d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 0h-1v2h2v-1h-1V9Zm-4 0h2v1h-1v1h-1V9Zm2 3v-1h-1v1h1Zm-1-4h1v1h-1V8Zm-3 0v1h1v1h-2v1h1v1H8v1h2v-2h1v1h1v2h-1v1h-3v-1H7v-1H4v1h3v-1h1v-1h1v-1H7V8h1Z"/>
              <path d="M7 12h1v3h-1v-3Zm-4 2v-1H2v1h1Z"/>
            </svg>
          </div>
          <h1>Dámdi QR</h1>
          <p>Цифровые QR-меню для ресторанов</p>
        </header>

        <div className="card">
          <h2>Вход в систему</h2>
          <p className="subtitle">Введите ваши данные для входа</p>

          <form id="loginForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
            {error && (
              <div id="errorMessage" style={{ color: 'red', marginTop: '10px', display: 'block' }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
