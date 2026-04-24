import { useState, useEffect } from 'react';
import { pollingService, Polling } from '../../services/pollingService';
import { 
    ChartPieSlice, 
    CheckCircle, 
    Clock, 
    ArrowRight,
    CircleNotch
} from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import { Modal } from '../../components/ui/Modal';

interface Props {
    pollingId: string;
    onVoteSuccess?: () => void;
}

export default function PollingParticipation({ pollingId, onVoteSuccess }: Props) {
    const [polling, setPolling] = useState<Polling | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOpsi, setSelectedOpsi] = useState<string | null>(null);
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    const showAlert = (message: string) => {
        setAlertMessage(message);
        setIsAlertOpen(true);
    };

    const loadPolling = async () => {
        setIsLoading(true);
        try {
            const data = await pollingService.getById(pollingId);
            setPolling(data);
            
            // Check if user has already voted (simple check based on names for now, 
            // but the backend handles unique constraint)
            // In a real app, we'd check against the current user's ID
        } catch (error) {
            console.error("Failed to load polling:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (pollingId) loadPolling();
    }, [pollingId]);

    const handleVote = async () => {
        if (!selectedOpsi || !polling) return;
        setIsVoting(true);
        try {
            await pollingService.vote(polling.id, selectedOpsi);
            setHasVoted(true);
            loadPolling();
            if (onVoteSuccess) onVoteSuccess();
        } catch (error: any) {
            showAlert(error.message || "Gagal mengirimkan pilihan.");
        } finally {
            setIsVoting(false);
        }
    };

    if (isLoading) return <div className="p-4 text-center animate-pulse"><Text.Label className="!text-slate-400 !font-bold">Memuat Polling...</Text.Label></div>;
    if (!polling) return null;

    const totalVotes = polling.opsi?.reduce((acc, curr) => acc + (curr._count?.votes || 0), 0) || 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-5 bg-brand-50/50 border-b border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-600 text-white rounded-lg shadow-sm">
                        <ChartPieSlice weight="fill" className="w-4 h-4" />
                    </div>
                    <Text.H2 className="!text-xs !font-black !text-slate-900 !uppercase !tracking-tight">Jajak Pendapat</Text.H2>
                </div>
                {polling.status === 'Aktif' ? (
                    <Text.Label className="px-2 py-0.5 bg-emerald-100 !text-emerald-700 !text-[9px] !font-black rounded-full border border-emerald-200 uppercase animate-pulse">Aktif</Text.Label>
                ) : (
                    <Text.Label className="px-2 py-0.5 bg-slate-100 !text-slate-500 !text-[9px] !font-black rounded-full border border-slate-200 uppercase">Selesai</Text.Label>
                )}
            </div>

            <div className="p-5 space-y-5">
                <div className="space-y-1">
                    <Text.Body className="!text-sm !font-bold !text-slate-800 !leading-tight">{polling.pertanyaan}</Text.Body>
                    <Text.Caption className="!text-[10px] !text-slate-400 !font-medium !italic">Berdasarkan usulan: {polling.aduan_usulan?.judul}</Text.Caption>
                </div>

                <div className="space-y-3">
                    {polling.opsi?.map((o) => {
                        const votes = o._count?.votes || 0;
                        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                        const isSelected = selectedOpsi === o.id;

                        return (
                            <button
                                key={o.id}
                                disabled={polling.status !== 'Aktif' || hasVoted}
                                onClick={() => setSelectedOpsi(o.id)}
                                className={`w-full group relative flex flex-col p-3 rounded-xl border transition-all duration-300 ${
                                    isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-slate-50/30 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex justify-between items-center z-10 w-full mb-1">
                                    <Text.Label className={`!text-[11px] !font-bold ${isSelected ? '!text-brand-700' : '!text-slate-600'}`}>{o.teks}</Text.Label>
                                    { (hasVoted || polling.status === 'Selesai') && (
                                        <Text.Label className="!text-[10px] !font-black !text-slate-400">{percentage}%</Text.Label>
                                    )}
                                </div>
                                <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                        className={`absolute left-0 top-0 h-full transition-all duration-1000 ${isSelected ? 'bg-brand-500' : 'bg-slate-300'}`}
                                        style={{ width: `${percentage}%` }}
                                     />
                                </div>
                                {(hasVoted || polling.status === 'Selesai') && (
                                    <Text.Caption className="!text-[9px] !text-slate-400 mt-1 !font-medium">{votes} Suara</Text.Caption>
                                )}
                            </button>
                        );
                    })}
                </div>

                {!hasVoted && polling.status === 'Aktif' && (
                    <button
                        onClick={handleVote}
                        disabled={!selectedOpsi || isVoting}
                        className="w-full py-3 bg-slate-900 border-b-4 border-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 active:translate-y-1 active:border-b-0 transition-all disabled:opacity-50"
                    >
                        {isVoting ? <CircleNotch weight="bold" className="animate-spin w-4 h-4" /> : <ArrowRight weight="bold" /> }
                        <Text.Label className="!text-white">Kirim Pilihan</Text.Label>
                    </button>
                )}

                {(hasVoted || polling.status === 'Selesai') && (
                    <div className="pt-2 flex items-center justify-center gap-2">
                        <CheckCircle weight="fill" className="text-emerald-600 w-4 h-4" />
                        <Text.Label className="!text-emerald-600">
                            {polling.status === 'Selesai' ? 'Polling Telah Berakhir' : 'Pilihan Anda Telah Terkirim'}
                        </Text.Label>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                    <Clock weight="bold" className="text-slate-400 w-3 h-3" />
                    <Text.Caption>Total {totalVotes} warga berpartisipasi</Text.Caption>
                </div>
            </div>

            <Modal 
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                title="Gagal"
                type="error"
            >
                {alertMessage}
            </Modal>
        </div>
    );
}
