import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TenantProvider } from '../contexts/TenantContext';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
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
import JoinRT from '../features/auth/JoinRT';
import WargaPortal from '../features/warga/WargaPortal';
import NotificationList from '../features/notifications/NotificationList';
import AduanList from '../features/aduan/AduanList';
import AduanForm from '../features/aduan/AduanForm';
import PollingForm from '../features/aduan/PollingForm';
import { DeviceSimulator } from './common/DeviceSimulator';
import { Outlet } from 'react-router-dom';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';
import SADashboard from '../features/superadmin/SADashboard';
import SATenantList from '../features/superadmin/SATenantList';
import SATenantDetail from '../features/superadmin/SATenantDetail';
import SASubscriptionManager from '../features/superadmin/SASubscriptionManager';
import SAAffiliate from '../features/superadmin/SAAffiliate';
import SAAnalytics from '../features/superadmin/SAAnalytics';
import SAMonitorWilayah from '../features/superadmin/SAMonitorWilayah';
import SAPackageManager from '../features/superadmin/SAPackageManager';
import Subscription from '../features/subscription/Subscription';

const router = createBrowserRouter([
    {
        element: <DeviceSimulator><Outlet /></DeviceSimulator>,
        children: [
            {
                path: '/',
                element: <App />,
            },
            {
                path: '/setup',
                element: <SetupPage />
            },
            {
                path: '/join/:tenantId',
                element: <JoinRT />
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
                path: '/dashboard',
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                )
            },
            {
                element: (
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                ),
                children: [
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
                        path: 'keuangan/edit/:id',
                        element: (
                            <ProtectedRoute requiredPermission={{ module: 'Buku Kas / Transaksi', action: 'Ubah' }}>
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
                            <ProtectedRoute>
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
                        path: 'notifications',
                        element: <NotificationList />
                    },
                    {
                        path: 'profile',
                        element: <Profile />
                    },
                    {
                        path: 'aduan',
                        element: (
                            <ProtectedRoute requiredPermission={{ module: 'Aduan & Usulan', action: 'Lihat' }}>
                                <AduanList />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'aduan/new',
                        element: (
                            <ProtectedRoute requiredPermission={{ module: 'Aduan & Usulan', action: 'Buat' }}>
                                <AduanForm />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'aduan/edit/:id',
                        element: (
                            <ProtectedRoute requiredPermission={{ module: 'Aduan & Usulan', action: 'Ubah' }}>
                                <AduanForm />
                            </ProtectedRoute>
                        )
                    },
                    {
                        path: 'aduan/polling/new/:id',
                        element: (
                            <ProtectedRoute requiredPermission={{ module: 'Aduan & Usulan', action: 'Ubah' }}>
                                <PollingForm />
                            </ProtectedRoute>
                        )
                    }
                ]
            },
            {
                path: 'subscription',
                element: (
                    <ProtectedRoute>
                        <Subscription />
                    </ProtectedRoute>
                )
            },
            {
                path: 'warga-portal',
                element: (
                    <ProtectedRoute>
                        <WargaPortal />
                    </ProtectedRoute>
                )
            }
        ]
    },
    {
        path: '/super-admin',
        element: (
            <ProtectedRoute requiredRole="super_admin">
                <SuperAdminLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <SADashboard /> },
            { path: 'tenants', element: <SATenantList /> },
            { path: 'tenants/:id', element: <SATenantDetail /> },
            { path: 'subscriptions', element: <SASubscriptionManager /> },
            { path: 'packages', element: <SAPackageManager /> },
            { path: 'monitor', element: <SAMonitorWilayah /> },
            { path: 'affiliates', element: <SAAffiliate /> },
            { path: 'analytics', element: <SAAnalytics /> }
        ]
    }
]);

import { FontProvider } from '../contexts/FontContext';
import { SyncProvider } from '../contexts/SyncContext';
import { ViewModeProvider } from '../contexts/ViewModeContext';

export function MainRouter() {
    return (
        <ViewModeProvider>
            <SyncProvider>
                <FontProvider>
                    <AuthProvider>
                        <TenantProvider>
                            <NotificationProvider>
                                <RouterProvider router={router} />
                            </NotificationProvider>
                        </TenantProvider>
                    </AuthProvider>
                </FontProvider>
            </SyncProvider>
        </ViewModeProvider>
    );
}


