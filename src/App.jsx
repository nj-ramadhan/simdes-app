import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardRW from './pages/rw/DashboardRW';
import DashboardRT from './pages/rt/DashboardRT';
import DashboardWarga from './pages/warga/DashboardWarga';

import Sensus from './pages/data/Sensus';
import Lingkungan from './pages/data/Lingkungan';
import Infrastruktur from './pages/data/Infrastruktur';
import Aset from './pages/data/Aset';

import LaporanKeuangan from './pages/keuangan/LaporanKeuangan';
import PublicHome from './pages/PublicHome';
import KegiatanPage from './pages/kegiatan/KegiatanPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/rw" element={
            <ProtectedRoute allowedRoles={['rw_admin']}><DashboardLayout /></ProtectedRoute>
          }>
            <Route index element={<DashboardRW />} />
            <Route path="warga" element={<Sensus />} />
            <Route path="lingkungan" element={<Lingkungan />} />
            <Route path="infrastruktur" element={<Infrastruktur />} />
            <Route path="aset" element={<Aset />} />
            <Route path="kegiatan" element={<KegiatanPage />} />
          </Route>

          <Route path="/rt" element={
            <ProtectedRoute allowedRoles={['rt_admin']}><DashboardLayout /></ProtectedRoute>
          }>
            <Route index element={<DashboardRT />} />
            <Route path="warga" element={<Sensus />} />
            <Route path="lingkungan" element={<Lingkungan />} />
            <Route path="infrastruktur" element={<Infrastruktur />} />
            <Route path="aset" element={<Aset />} />
            <Route path="kegiatan" element={<KegiatanPage />} />
          </Route>

          <Route path="/warga" element={
            <ProtectedRoute allowedRoles={['warga']}><DashboardLayout /></ProtectedRoute>
          }>
            <Route index element={<DashboardWarga />} />
            <Route path="warga" element={<Sensus />} />
            <Route path="kegiatan" element={<KegiatanPage />} />
          </Route>

          {/* Laporan keuangan memakai layout dan navigasi yang sama dengan halaman data. */}
          <Route path="/keuangan" element={
            <ProtectedRoute allowedRoles={['rw_admin', 'rt_admin', 'warga']}><DashboardLayout /></ProtectedRoute>
          }>
            <Route path=":jenis" element={<LaporanKeuangan />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}