
import { useNavigate } from 'react-router-dom';
import { Text } from '../../components/ui/Typography';
import { ArrowLeft, Bell, Info, CheckCircle, Warning } from '@phosphor-icons/react';

export default function NotificationList() {
    const navigate = useNavigate();

    // Mock data based on Anti-Hallucination rule
    const notifications = [
        {
            id: 1,
            title: 'Iuran Diverifikasi',
            body: 'Pembayaran Iuran bulan Oktober 2024 telah diverifikasi oleh Bendahara.',
            time: '10 menit yang lalu',
            type: 'success',
            read: false,
        },
        {
            id: 2,
            title: 'Jadwal Ronda Malam Ini',
            body: 'Jangan lupa jadwal ronda Anda malam ini pukul 22:00 WIB.',
            time: '3 jam yang lalu',
            type: 'info',
            read: true,
        },
        {
            id: 3,
            title: 'Pengumuman Kerja Bakti',
            body: 'Kerja bakti membersihkan lingkungan RT akan dilaksanakan hari Minggu ini.',
            time: '1 hari yang lalu',
            type: 'warning',
            read: true,
        }
    ];

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle weight="fill" className="text-emerald-500 w-6 h-6" />;
            case 'warning': return <Warning weight="fill" className="text-amber-500 w-6 h-6" />;
            default: return <Info weight="fill" className="text-blue-500 w-6 h-6" />;
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 px-5 pt-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 bg-transparent text-slate-500 rounded-full transition-colors"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <Text.H1 className="!text-xl">Notifikasi</Text.H1>
            </div>

            {/* List */}
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Bell weight="duotone" className="w-8 h-8 text-slate-300" />
                        </div>
                        <Text.H2 className="!text-slate-500 mb-1">Belum ada notifikasi</Text.H2>
                        <Text.Body className="!text-slate-400 text-sm">Notifikasi baru akan muncul di sini</Text.Body>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className={`p-5 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        >
                            <div className="shrink-0 pt-1">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <Text.H2 className={`!text-[15px] ${!notif.read ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                                        {notif.title}
                                    </Text.H2>
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-brand-500 rounded-full shrink-0 mt-1.5"></div>
                                    )}
                                </div>
                                <Text.Body className="!text-slate-600 mb-2 leading-relaxed">
                                    {notif.body}
                                </Text.Body>
                                <Text.Caption className="!text-slate-400">
                                    {notif.time}
                                </Text.Caption>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
