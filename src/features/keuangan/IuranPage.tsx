import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CurrencyCircleDollar, ClockCounterClockwise } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import IuranForm from './IuranForm';
import IuranList from './IuranList';

type IuranTab = 'bayar' | 'riwayat';

export default function IuranPage() {
    const { user: authUser } = useAuth();
    const isWarga =
        authUser?.role?.toLowerCase() === 'warga' ||
        authUser?.role_entity?.name?.toLowerCase() === 'warga';

    const [activeTab, setActiveTab] = useState<IuranTab>(isWarga ? 'bayar' : 'riwayat');

    const tabs: { id: IuranTab; label: string; icon: React.ElementType }[] = [
        { id: 'bayar', label: 'Bayar', icon: CurrencyCircleDollar },
        { id: 'riwayat', label: 'Riwayat', icon: ClockCounterClockwise },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* ─── Sticky Tab Header ─── */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-5 pt-5 pb-0">
                    {/* Page Title Row */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-[14px] bg-emerald-50 flex items-center justify-center shrink-0">
                            <CurrencyCircleDollar weight="duotone" className="text-emerald-600 text-xl" />
                        </div>
                        <div>
                            <Text.H1 className="!text-[20px] !leading-tight">Iuran Warga</Text.H1>
                            <Text.Caption className="!not-italic !text-slate-400 !text-[11px]">
                                {isWarga
                                    ? 'Bayar tagihan atau cek riwayat pembayaran'
                                    : 'Catat pembayaran atau kelola riwayat iuran'}
                            </Text.Caption>
                        </div>
                    </div>

                    {/* Tab Switcher Pill */}
                    <div className="flex gap-1 bg-slate-100 rounded-[16px] p-1 w-full max-w-md mx-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[13px] font-bold transition-all duration-200 active:scale-95 ${
                                        isActive
                                            ? 'bg-white text-slate-800 shadow-[0_2px_8px_rgb(0,0,0,0.08)]'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <Icon
                                        weight={isActive ? 'fill' : 'regular'}
                                        className={`w-4 h-4 transition-colors ${
                                            isActive
                                                ? tab.id === 'bayar'
                                                    ? 'text-emerald-600'
                                                    : 'text-brand-600'
                                                : ''
                                        }`}
                                    />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Sliding indicator line */}
                    <div className="relative h-[2.5px] mt-1 w-full max-w-md mx-auto">
                        <div className="absolute inset-0 bg-slate-200/50 rounded-full" />
                        <div
                            className={`absolute top-0 h-[2px] w-1/2 rounded-full transition-all duration-300 ${
                                activeTab === 'bayar'
                                    ? 'left-0 bg-emerald-500'
                                    : 'left-1/2 bg-brand-500'
                            }`}
                        />
                    </div>
                </div>
            </div>

            {/* ─── Tab Content ─── */}
            <div className="pb-24">
                {activeTab === 'bayar' && (
                    <div key="tab-bayar" className="animate-fade-in">
                        {/* IuranForm in inlineMode: hides its own header & uses sticky action bar */}
                        <IuranForm
                            inlineMode
                            onSuccess={() => setActiveTab('riwayat')}
                        />
                    </div>
                )}

                {activeTab === 'riwayat' && (
                    <div key="tab-riwayat" className="px-5 pt-5 animate-fade-in">
                        {/* IuranList already handles both warga-filtered & full list */}
                        <IuranList inTab />
                    </div>
                )}
            </div>
        </div>
    );
}
