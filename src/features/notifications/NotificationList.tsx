
import { useNavigate } from 'react-router-dom';
import { Text } from '../../components/ui/Typography';
import { 
    ArrowLeft, 
    Bell, 
    Info, 
    CheckCircle, 
    Warning, 
    EnvelopeSimple, 
    CurrencyCircleDollar, 
    Users, 
    Package, 
    CalendarCheck,
    Note
} from '@phosphor-icons/react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Aktivitas } from '../../types/database';
import { useEffect } from 'react';

export default function NotificationList() {
    const navigate = useNavigate();
    const { notifications, markAsRead, refresh } = useNotifications();

    useEffect(() => {
        markAsRead();
        refresh();
    }, [markAsRead, refresh]);

    const getIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('iuran')) return <CurrencyCircleDollar weight="fill" className="text-emerald-500 w-6 h-6" />;
        if (a.includes('surat')) return <EnvelopeSimple weight="fill" className="text-blue-500 w-6 h-6" />;
        if (a.includes('warga')) return <Users weight="fill" className="text-amber-500 w-6 h-6" />;
        if (a.includes('aset')) return <Package weight="fill" className="text-cyan-500 w-6 h-6" />;
        if (a.includes('agenda')) return <CalendarCheck weight="fill" className="text-purple-500 w-6 h-6" />;
        if (a.includes('notulen')) return <Note weight="fill" className="text-slate-500 w-6 h-6" />;
        if (a.includes('verifikasi')) return <CheckCircle weight="fill" className="text-emerald-500 w-6 h-6" />;
        if (a.includes('tolak')) return <Warning weight="fill" className="text-red-500 w-6 h-6" />;
        return <Info weight="fill" className="text-brand-500 w-6 h-6" />;
    };

    const handleItemClick = (notif: Aktivitas) => {
        if (notif.target_url) {
            navigate(notif.target_url);
        } else {
            // Fallback mapping
            const a = notif.action.toLowerCase();
            if (a.includes('iuran')) navigate('/iuran');
            else if (a.includes('surat')) navigate('/surat');
            else if (a.includes('warga')) navigate('/warga');
            else if (a.includes('aset')) navigate('/aset');
            else if (a.includes('agenda')) navigate('/agenda');
            else if (a.includes('notulen')) navigate('/notulensi');
        }
    };

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} hari yang lalu`;
        if (hours > 0) return `${hours} jam yang lalu`;
        if (minutes > 0) return `${minutes} menit yang lalu`;
        return 'Baru saja';
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
                <Text.H1 className="!text-xl">Notifikasi & Aktivitas</Text.H1>
            </div>

            {/* List */}
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Bell weight="duotone" className="w-8 h-8 text-slate-300" />
                        </div>
                        <Text.H2 className="!text-slate-500 mb-1">Belum ada aktivitas</Text.H2>
                        <Text.Body className="!text-slate-400 text-sm">Aktivitas terbaru akan muncul di sini</Text.Body>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            onClick={() => handleItemClick(notif)}
                            className="p-5 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <div className="shrink-0 pt-1">
                                {getIcon(notif.action)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <Text.H2 className="!text-[15px] text-slate-900 font-bold">
                                        {notif.action}
                                    </Text.H2>
                                </div>
                                <Text.Body className="!text-slate-600 mb-2 leading-relaxed text-sm">
                                    <span dangerouslySetInnerHTML={{ __html: notif.details.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                </Text.Body>
                                <Text.Caption className="!text-slate-400">
                                    {formatTime(notif.timestamp)}
                                </Text.Caption>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

