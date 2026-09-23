import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'rw_admin') navigate('/rw');
      else if (user.role === 'rt_admin') navigate('/rt');
      else navigate('/warga');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal login');
    }
  }

  return (
    <div className="login-screen">
      <div className="login-shell">
        <aside className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-logo">S</div>
            <div>
              <h1>SIMDES</h1>
              <p>Sistem Informasi Masyarakat Desa</p>
            </div>
          </div>
          <div className="login-highlight">
            <span className="login-tag">Dashboard RW/RT</span>
            <p>Kelola data warga, laporan, aset, Iuran, dan kegiatan perangkat lingkungan secara terintegrasi.</p>
          </div>
        </aside>

        <section className="login-card-wrap">
          <form onSubmit={handleSubmit} className="login-card">
            <div className="login-header">
              <span className="login-kicker">Portal Login</span>
              <h2>Selamat Datang</h2>
              <button type="button" className="back-to-public" onClick={() => navigate('/')}>Kembali ke Transparansi</button>
            </div>
            {error && <p className="login-error">{error}</p>}
            <div className="field-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email" placeholder="nama@domain.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="field-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-control"
              />
            </div>
            <button type="submit" className="login-button">
              Masuk ke Dashboard
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}