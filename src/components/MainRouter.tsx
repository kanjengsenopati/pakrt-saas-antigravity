import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TenantProvider } from '../contexts/TenantContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import App from '../App';
import Login from '../features/auth/Login';
import Dashboard from '../features/dashboard/Dashboard';
import SetupPage from '../features/admin/SetupPage';
import RegisterWizard from '../features/onboarding/RegisterWizard';
import { AppLayout } from '../layouts/AppLayout';
import WargaList from '../features/warga/WargaList';
import WargaForm from '../features/warga/WargaForm';
import WargaDetail from '../features/warga/WargaDetail';
import PengurusList from '../features/pengurus/PengurusList';
import PengurusForm from '../features/pengurus/PengurusForm';
import NotulensiList from '../features/notulensi/NotulensiList';
import NotulensiForm from '../features/notulensi/NotulensiForm';
import AsetList from '../features/aset/AsetList';
import AsetForm from '../features/aset/AsetForm';
import SuratList from '../features/surat/SuratList';
import SuratForm from '../features/surat/SuratForm';
import CetakSurat from '../features/surat/CetakSurat';
import VerifySurat from '../features/surat/VerifySurat';
import RondaList from '../features/ronda/RondaList';
import RondaForm from '../features/ronda/RondaForm';
import AgendaList from '../features/agenda/AgendaList';
import AgendaForm from '../features/agenda/AgendaForm';
import KeuanganList from '../features/keuangan/KeuanganList';
import KeuanganForm from '../features/keuangan/KeuanganForm';
import IuranList from '../features/keuangan/IuranList';
import IuranForm from '../features/keuangan/IuranForm';
import Pengaturan from '../features/pengaturan/Pengaturan';
import Profile from '../features/profile/Profile';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
    },
    {
        path: '/setup',
        element: <SetupPage />
    },
    {
        path: '/register',
        element: <RegisterWizard />
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/surat/cetak/:id',
        element: <CetakSurat />
    },
    {
        path: '/verify/:id',
        element: <VerifySurat />
    },
    {
        element: (
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                path: 'dashboard',
                element: <Dashboard />
            },
            {
                path: 'warga',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Warga', action: 'Lihat' }}>
                        <WargaList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'warga/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Warga', action: 'Buat' }}>
                        <WargaForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'warga/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Warga', action: 'Lihat' }}>
                        <WargaDetail />
                    </ProtectedRoute>
                )
            },
            {
                path: 'warga/edit/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Warga', action: 'Ubah' }}>
                        <WargaForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'pengurus',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Pengurus', action: 'Lihat' }}>
                        <PengurusList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'pengurus/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Pengurus', action: 'Buat' }}>
                        <PengurusForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'pengurus/edit/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Pengurus', action: 'Ubah' }}>
                        <PengurusForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'notulensi',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Notulensi', action: 'Lihat' }}>
                        <NotulensiList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'notulensi/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Notulensi', action: 'Buat' }}>
                        <NotulensiForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'notulensi/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Notulensi', action: 'Ubah' }}>
                        <NotulensiForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'aset',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Aset', action: 'Lihat' }}>
                        <AsetList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'aset/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Aset', action: 'Buat' }}>
                        <AsetForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'aset/edit/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Aset', action: 'Ubah' }}>
                        <AsetForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'surat',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Surat / Cetak', action: 'Lihat' }}>
                        <SuratList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'surat/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Surat / Cetak', action: 'Buat' }}>
                        <SuratForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'ronda',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Jadwal Ronda', action: 'Lihat' }}>
                        <RondaList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'ronda/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Jadwal Ronda', action: 'Buat' }}>
                        <RondaForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'ronda/edit/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Jadwal Ronda', action: 'Ubah' }}>
                        <RondaForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'agenda',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Agenda', action: 'Lihat' }}>
                        <AgendaList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'agenda/new',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Agenda', action: 'Buat' }}>
                        <AgendaForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'agenda/edit/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Agenda', action: 'Ubah' }}>
                        <AgendaForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'keuangan',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Buku Kas / Transaksi', action: 'Lihat' }}>
                        <KeuanganList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'keuangan/baru',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Buku Kas / Transaksi', action: 'Buat' }}>
                        <KeuanganForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'iuran',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Iuran Warga', action: 'Lihat' }}>
                        <IuranList />
                    </ProtectedRoute>
                )
            },
            {
                path: 'iuran/baru',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Iuran Warga', action: 'Buat' }}>
                        <IuranForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'iuran/edit/:id',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Iuran Warga', action: 'Ubah' }}>
                        <IuranForm />
                    </ProtectedRoute>
                )
            },
            {
                path: 'pengaturan',
                element: (
                    <ProtectedRoute requiredPermission={{ module: 'Setup / Pengaturan', action: 'Lihat' }}>
                        <Pengaturan />
                    </ProtectedRoute>
                )
            },
            {
                path: 'profile',
                element: <Profile />
            }
        ]
    }
]);

export function MainRouter() {
    return (
        <AuthProvider>
            <TenantProvider>
                <RouterProvider router={router} />
            </TenantProvider>
        </AuthProvider>
    );
}



