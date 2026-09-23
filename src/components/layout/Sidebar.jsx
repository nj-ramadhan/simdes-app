import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABEL = { rw_admin: 'Admin RW', rt_admin: 'Admin RT', warga: 'Warga' };

const MENU_BY_ROLE = {
  rw_admin: [
    { to: '/rw', label: 'Dashboard' },
    { to: '/rw/warga', label: 'Data Sensus Warga' },
    { to: '/rw/lingkungan', label: 'Data Lingkungan' },
    { to: '/rw/infrastruktur', label: 'Data Infrastruktur' },
    { to: '/rw/aset', label: 'Data Aset' },
    { to: '/rw/kegiatan', label: 'Laporan Kegiatan' },
  ],
  rt_admin: [
    { to: '/rt', label: 'Dashboard' },
    { to: '/rt/warga', label: 'Data Sensus Warga' },
    { to: '/rt/lingkungan', label: 'Data Lingkungan' },
    { to: '/rt/infrastruktur', label: 'Data Infrastruktur' },
    { to: '/rt/aset', label: 'Data Aset' },
    { to: '/rt/kegiatan', label: 'Laporan Kegiatan' },
  ],
  warga: [
    { to: '/warga', label: 'Dashboard' },
    { to: '/warga/warga', label: 'Data Warga Lain' },
    { to: '/warga/kegiatan', label: 'Laporan Kegiatan' },
  ],
};

const KEUANGAN_MENU = [
  { jenis: 'global', label: 'Kas Global' },
  { jenis: 'sampah', label: 'Iuran Sampah' },
  { jenis: 'keamanan', label: 'Iuran Keamanan' },
  { jenis: 'dana-sosial', label: 'Dana Sosial' },
  { jenis: 'dana-kematian', label: 'Dana Kematian' },
  { jenis: 'kompensasi', label: 'Dana Kompensasi' },
];

export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuth();
  const menu = MENU_BY_ROLE[user.role] || [];

  return (
    <aside className="app-sidebar" aria-hidden={!open}>
      <div className="brand-wrap">
        <div className="brand-icon">
          <span aria-hidden="true">S</span>
        </div>
        <div>
          <div className="brand-title">SIMDES</div>
          <div className="brand-subtitle">Sistem Informasi Desa</div>
        </div>
      </div>

      <button type="button" className="sidebar-close" onClick={onToggle} aria-label="Tutup navigasi">×</button>

      <div className="profile-card">
        <div className="profile-avatar">
          {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <div className="profile-name">{user?.nama || 'Pengguna'}</div>
          <div className="profile-role">{ROLE_LABEL[user?.role] || 'User'}</div>
        </div>
      </div>

      <nav className="side-nav">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length === 2}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon" aria-hidden="true">
              {item.label.includes('Dashboard') ? '◇' : item.label.includes('Data') ? '◌' : '○'}
            </span>
            {item.label}
          </NavLink>
        ))}

        <div className="nav-section-title">Laporan Keuangan</div>
        {KEUANGAN_MENU.map((k) => (
          <NavLink
            key={k.jenis}
            to={`/keuangan/${k.jenis}`}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon" aria-hidden="true">✦</span>
            {k.label}
          </NavLink>
        ))}
      </nav>

      <button onClick={logout} className="logout-button">
        <span aria-hidden="true">↵</span>
        Keluar
      </button>
    </aside>
  );
}
