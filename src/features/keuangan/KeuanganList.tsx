import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { keuanganService } from '../../services/keuanganService';
import { useAuth } from '../../contexts/AuthContext';
import { Keuangan } from '../../database/db';
import {
    Plus,
    Funnel,
    Trash,
    PencilSimple,
    ArrowDownRight,
    Image as ImageIcon,
    X,
    CheckCircle,
    Coins
} from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import { formatRupiah } from '../../utils/currency';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';
import { wargaService } from '../../services/wargaService';
import { pengaturanService } from '../../services/pengaturanService';
// Removed unused Recharts imports to fix lint warnings

const getMonthNumber = (monthName: string) => {
    const months = {
        'JANUARI': 1, 'PEBRUARI': 2, 'FEBRUARI': 2, 'MARET': 3, 'APRIL': 4, 'MEI': 5, 'JUNI': 6,
        'JULI': 7, 'AGUSTUS': 8, 'SEPTEMBER': 9, 'OKTOBER': 10, 'NOPEMBER': 11, 'NOVEMBER': 11, 'DESEMBER': 12,
        'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'JUN': 6,
        'JUL': 7, 'AGU': 8, 'SEP': 9, 'OKT': 10, 'NOV': 11, 'DES': 12
    };
    return months[monthName.toUpperCase() as keyof typeof months] || 0;
};

const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

type FilterType = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';
type TrxTypeFilter = 'ALL' | 'IN' | 'OUT';

export default function KeuanganList() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const { user } = useAuth();
    const isWarga = user?.role === 'WARGA';

    const [transactions, setTransactions] = useState<Keuangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProof, setSelectedProof] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filter States
    const [filterType, setFilterType] = useState<FilterType>('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const filterRef = useRef<HTMLDivElement>(null);

    // Transaction Type Filter state
    const [trxTypeFilter, setTrxTypeFilter] = useState<TrxTypeFilter>('ALL');
    const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
    const typeFilterRef = useRef<HTMLDivElement>(null);

    // Statistics & Tabs State
    const [activeTab, setActiveTab] = useState<'laporan' | 'statistik'>('laporan');
    const [wargaStats, setWargaStats] = useState<{ total: number, dihuni: number, kosong: number }>({ total: 0, dihuni: 0, kosong: 0 });
    const [incomeSettings, setIncomeSettings] = useState<any[]>([]);
    const [occupancySettings, setOccupancySettings] = useState<Record<string, number>>({});

    // Statistics Filter State
    const [statFilterType, setStatFilterType] = useState<FilterType>('THIS_MONTH');
    const [isStatFilterOpen, setIsStatFilterOpen] = useState(false);
    const [statCustomRange, setStatCustomRange] = useState({ start: '', end: '' });
    const statFilterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant, currentScope]);

    // Handle Close Dropdowns on Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
            if (typeFilterRef.current && !typeFilterRef.current.contains(event.target as Node)) {
                setIsTypeFilterOpen(false);
            }
            if (statFilterRef.current && !statFilterRef.current.contains(event.target as Node)) {
                setIsStatFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await keuanganService.getAll(currentTenant.id, currentScope);
            setTransactions(data.items || []);
            
            // Load Statistics Data
            const [wargaData, configItems] = await Promise.all([
                wargaService.getAll(currentTenant.id, currentScope, 1, 1000),
                pengaturanService.getAll(currentTenant.id, currentScope)
            ]);
            
            const config: Record<string, any> = {};
            configItems.forEach(i => config[i.key] = i.value);
            
            const verifiedWarga = (wargaData.items || []).filter((w: any) => w.verification_status === 'VERIFIED');
            const dihuni = verifiedWarga.filter((w: any) => (w.status_rumah || 'Dihuni').toLowerCase() === 'dihuni').length;
            const kosong = verifiedWarga.filter((w: any) => (w.status_rumah || 'Dihuni').toLowerCase() === 'kosong').length;
            setWargaStats({ total: verifiedWarga.length, dihuni, kosong });
            
            try {
                setIncomeSettings(config.jenis_pemasukan ? JSON.parse(config.jenis_pemasukan) : []);
                setOccupancySettings({
                    'dihuni': parseFloat(config.iuran_tetap_dihuni) || 0,
                    'kosong': parseFloat(config.iuran_tetap_kosong) || 0
                });
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        } catch (error) {
            console.error("Failed to load keuangan data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
            await keuanganService.delete(id);
            loadData();
        }
    };

    const displayedTransactions = useMemo(() => {
        let filtered = transactions.filter(t =>
            t.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.kategori.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Apply Transaction Type Filter
        if (trxTypeFilter !== 'ALL') {
            filtered = filtered.filter(t => 
                trxTypeFilter === 'IN' ? t.tipe === 'pemasukan' : t.tipe === 'pengeluaran'
            );
        }

        // Apply Date range Filter
        if (filterType !== 'ALL') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(t => {
                const trxDate = new Date(t.tanggal);
                const itemDate = new Date(trxDate.getFullYear(), trxDate.getMonth(), trxDate.getDate());

                switch (filterType) {
                    case 'TODAY':
                        return itemDate.getTime() === today.getTime();
                    case 'THIS_WEEK': {
                        const firstDayOfWeek = new Date(today);
                        firstDayOfWeek.setDate(today.getDate() - today.getDay());
                        return itemDate >= firstDayOfWeek;
                    }
                    case 'THIS_MONTH':
                        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
                    case 'THIS_YEAR':
                        return itemDate.getFullYear() === today.getFullYear();
                    case 'CUSTOM':
                        if (customRange.start && customRange.end) {
                            const start = new Date(customRange.start);
                            const end = new Date(customRange.end);
                            end.setHours(23, 59, 59, 999);
                            return itemDate >= start && itemDate <= end;
                        }
                        return true;
                    default:
                        return true;
                }
            });
        }

        return filtered.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [transactions, searchQuery, filterType, customRange, trxTypeFilter]);

    const displayedSummary = useMemo(() => {
        return displayedTransactions.reduce((acc, curr) => {
            if (curr.tipe === 'pemasukan') acc.kasMasuk += curr.nominal;
            else acc.kasKeluar += curr.nominal;
            acc.saldo = acc.kasMasuk - acc.kasKeluar;
            return acc;
        }, { kasMasuk: 0, kasKeluar: 0, saldo: 0 });
    }, [displayedTransactions]);

    const statistics = useMemo(() => {
        // 1. Calculate Period Factor
        let monthFactor = 1;
        const now = new Date();

        if (statFilterType === 'THIS_YEAR') {
            monthFactor = 12;
        } else if (statFilterType === 'CUSTOM' && statCustomRange.start && statCustomRange.end) {
            const start = new Date(statCustomRange.start);
            const end = new Date(statCustomRange.end);
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
            monthFactor = Math.max(1, months);
        }

        // 2. Base Target Calculation (per month)
        const iuranDihuni = (occupancySettings.dihuni || 0) * wargaStats.dihuni;
        const iuranKosong = (occupancySettings.kosong || 0) * wargaStats.kosong;
        
        const mandatoryOthers = incomeSettings
            .filter(item => item.is_mandatory)
            .reduce((sum, item) => sum + (item.nominal * wargaStats.total), 0);
            
        const target = (iuranDihuni + iuranKosong + mandatoryOthers) * monthFactor;
        
        // 3. Realisasi
        // Filter transactions based on date range
        const mandatoryItemNames = [
            ...incomeSettings.filter(i => i.is_mandatory).map(i => i.nama.toLowerCase())
        ];
        
        const isMandatoryMatch = (t: Keuangan) => {
            const cat = t.kategori.toLowerCase();
            return mandatoryItemNames.includes(cat) || cat === 'iuran warga';
        };

        const filteredTrx = transactions.filter(t => {
            if (t.tipe !== 'pemasukan' || !isMandatoryMatch(t)) return false;
            
            const trxDate = new Date(t.tanggal);
            const itemDate = new Date(trxDate.getFullYear(), trxDate.getMonth(), trxDate.getDate());

            switch (statFilterType) {
                case 'ALL':
                    return true;
                case 'THIS_MONTH':
                    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                case 'THIS_YEAR':
                    return itemDate.getFullYear() === now.getFullYear();
                case 'CUSTOM':
                    if (statCustomRange.start && statCustomRange.end) {
                        const start = new Date(statCustomRange.start);
                        const end = new Date(statCustomRange.end);
                        end.setHours(23, 59, 59, 999);
                        return itemDate >= start && itemDate <= end;
                    }
                    return true;
                default: 
                    return true;
            }
        });
        
        const realisasi = filteredTrx.reduce((sum, t) => sum + t.nominal, 0);
        const status = target > 0 ? (realisasi / target) * 100 : 0;
        
        // 4. Status Configuration (Dynamic Colors & Labels)
        let statusColor = '#2563EB'; // Default Sedang (Blue)
        let statusLabel = 'Sedang';
        let statusBg = 'bg-blue-500';
        
        if (status <= 30) {
            statusColor = '#E11D48'; // Buruk (Rose)
            statusLabel = 'Buruk';
            statusBg = 'bg-rose-500';
        } else if (status > 70) {
            statusColor = '#059669'; // Bagus (Emerald)
            statusLabel = 'Bagus';
            statusBg = 'bg-emerald-500';
        }

        // 5. Incidental & Agenda Breakdown
        const incidentalIncome = transactions
            .filter(t => t.tipe === 'pemasukan' && !isMandatoryMatch(t))
            .reduce((sum, t) => sum + t.nominal, 0);
            
        const agendaExpenses = transactions
            .filter(t => t.tipe === 'pengeluaran' && (t.kategori.toLowerCase().includes('agenda') || !!(t as any).agendaId))
            .reduce((sum, t) => sum + t.nominal, 0);
        
        return {
            target,
            realisasi, // Mandatory only
            incidentalIncome,
            agendaExpenses,
            status,
            statusColor,
            statusLabel,
            statusBg,
            kekurangan: Math.max(0, target - realisasi),
            wargaTotal: wargaStats.total
        };
    }, [transactions, wargaStats, incomeSettings, occupancySettings, statFilterType, statCustomRange]);

    const formatFormalId = (dateString: string, itemId: string) => {
        const d = new Date(dateString);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const shortId = itemId.substring(0, 3).toLowerCase();
        return `${yyyy}${mm}${dd}-${shortId}`;
    };

    const parseKeterangan = (keterangan: string) => {
        const cleaned = keterangan.replace(/\s*\|\s*ref:[a-f0-9-]+$/i, '').trim();
        const newFormatMatch = cleaned.match(/^\[([^\]]+)\]\s+(.+?)\s+—\s+(.+)$/);
        if (newFormatMatch) {
            const periodStr = newFormatMatch[3];
            const yearMatch = periodStr.match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
            const monthsStr = periodStr.replace(/\d{4}/, '').trim();
            const monthParts = monthsStr.split(/[,\s]+/)
                .map(m => m.trim().toUpperCase().replace(/[^A-Z]/g, ''))
                .filter(m => m.length > 0);
            const months = monthParts.map(getMonthNumber).filter(m => m > 0);

            return {
                wargaNama: newFormatMatch[1],
                label: newFormatMatch[2],
                period: periodStr,
                months: months as number[],
                year,
                isIuran: true,
                raw: cleaned
            };
        }

        if (cleaned.toUpperCase().startsWith('[AUTO]')) {
            return {
                wargaNama: null,
                label: toTitleCase(cleaned.replace(/\[AUTO\]\s*/i, '').split('|')[0].trim()),
                period: null,
                months: [] as number[],
                year: null,
                isIuran: false,
                raw: cleaned
            };
        }

        return {
            wargaNama: null,
            label: toTitleCase(cleaned.split('|')[0].trim()),
            period: null,
            months: [] as number[],
            year: null,
            isIuran: false,
            raw: cleaned
        };
    };

    return (
        <div className="space-y-4 animate-fade-in relative px-3 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Text.H1>Laporan Kas RT</Text.H1>
                </div>
                {!isWarga && (
                    <HasPermission module="Buku Kas / Transaksi" action="Buat">
                        <button
                            onClick={() => navigate('/keuangan/baru')}
                            className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                        >
                            <Plus weight="bold" size={18} />
                            <span>Catat Transaksi</span>
                        </button>
                        
                        <button
                            onClick={() => navigate('/keuangan/baru')}
                            className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                        >
                            <Plus weight="bold" size={24} />
                        </button>
                    </HasPermission>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-[24px] border border-slate-200/60 w-full mb-1 gap-1.5 shadow-inner">
                <button
                    onClick={() => setActiveTab('laporan')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 text-sm font-bold rounded-[20px] transition-all duration-300 ${activeTab === 'laporan' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    Transaksi
                </button>
                <button
                    onClick={() => setActiveTab('statistik')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 text-sm font-bold rounded-[20px] transition-all duration-300 ${activeTab === 'statistik' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    Statistik
                </button>
            </div>

            {activeTab === 'laporan' ? (
                <>

            <div className="grid grid-cols-3 gap-3 md:gap-4 -mt-1">
                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                    <Text.Label className="mb-1">Kas Masuk</Text.Label>
                    <Text.Amount className="text-sm sm:text-xl lg:text-2xl text-brand-600 leading-none">{formatRupiah(displayedSummary.kasMasuk)}</Text.Amount>
                </div>

                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
                    <Text.Label className="mb-1">Kas Keluar</Text.Label>
                    <Text.Amount className="text-sm sm:text-xl lg:text-2xl text-red-600 leading-none">{formatRupiah(displayedSummary.kasKeluar)}</Text.Amount>
                </div>

                <div className={`p-4 rounded-[24px] border shadow-premium relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center text-center ${displayedSummary.saldo >= 0 ? 'bg-white border-slate-100' : 'bg-red-900 border-red-800'}`}>
                    <Text.Label className={`mb-1 ${displayedSummary.saldo >= 0 ? '' : 'text-white/70'}`}>Saldo</Text.Label>
                    <Text.Amount className={`text-sm sm:text-xl lg:text-2xl leading-none ${displayedSummary.saldo >= 0 ? 'text-brand-600' : 'text-white'}`}>{formatRupiah(displayedSummary.saldo)}</Text.Amount>
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-premium border border-slate-100 overflow-hidden -mt-1">
                <div className="p-4 border-b border-slate-50 flex gap-2 items-center justify-between bg-white overflow-visible">
                    <div className="relative flex-1 group">
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-5 pr-4 py-3 bg-slate-50 border-none rounded-[16px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Transaction Type Filter */}
                        <div className="relative" ref={typeFilterRef}>
                            <button 
                                onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${trxTypeFilter !== 'ALL' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-transparent hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill={trxTypeFilter !== 'ALL' ? "indigo" : "currentColor"} viewBox="0 0 256 256"><path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56h72V200H40ZM216,200H128V56h88V200Z"></path></svg>
                            </button>

                            {isTypeFilterOpen && (
                                <div className="absolute top-14 right-0 z-[100] w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in zoom-in-95 duration-200">
                                    <div className="space-y-1">
                                        {[
                                            { id: 'ALL', label: 'Semua Transaksi' },
                                            { id: 'IN', label: 'Kas Masuk' },
                                            { id: 'OUT', label: 'Kas Keluar' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setTrxTypeFilter(opt.id as TrxTypeFilter);
                                                    setIsTypeFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${trxTypeFilter === opt.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{opt.label}</span>
                                                {trxTypeFilter === opt.id && <CheckCircle weight="fill" className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date Picker Filter */}
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${filterType !== 'ALL' ? 'bg-brand-50 text-brand-600 border-brand-200 shadow-sm' : 'bg-slate-50 text-slate-400 border-transparent hover:text-brand-600 hover:bg-brand-50 hover:border-brand-100'}`}
                            >
                                <Funnel weight={filterType !== 'ALL' ? "fill" : "bold"} className="w-5 h-5" />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute top-14 right-0 z-[100] w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in zoom-in-95 duration-200">
                                    <div className="space-y-1">
                                        {[
                                            { id: 'ALL', label: 'Semua Periode' },
                                            { id: 'TODAY', label: 'Hari Ini' },
                                            { id: 'THIS_WEEK', label: 'Minggu Ini' },
                                            { id: 'THIS_MONTH', label: 'Bulan Ini' },
                                            { id: 'THIS_YEAR', label: 'Tahun Ini' },
                                            { id: 'CUSTOM', label: 'Pilih Sendiri' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setFilterType(opt.id as FilterType);
                                                    if (opt.id !== 'CUSTOM') setIsFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${filterType === opt.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{opt.label}</span>
                                                {filterType === opt.id && <CheckCircle weight="fill" className="w-4 h-4 text-brand-600" />}
                                            </button>
                                        ))}
                                    </div>

                                    {filterType === 'CUSTOM' && (
                                        <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-widest">Mulai</label>
                                                <input 
                                                    type="date" 
                                                    value={customRange.start}
                                                    onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-widest">Selesai</label>
                                                <input 
                                                    type="date" 
                                                    value={customRange.end}
                                                    onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => setIsFilterOpen(false)}
                                                className="w-full py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
                                            >
                                                Terapkan Filter
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-4"><Text.Label className="!text-slate-400">Tanggal</Text.Label></th>
                                <th className="p-4"><Text.Label className="!text-slate-400">Kategori & Keterangan</Text.Label></th>
                                <th className="p-4 text-right"><Text.Label className="!text-slate-400">Masuk</Text.Label></th>
                                <th className="p-4 text-right"><Text.Label className="!text-slate-400">Keluar</Text.Label></th>
                                <th className="p-4 text-center"><Text.Label className="!text-slate-400">Bukti</Text.Label></th>
                                <th className="p-4 text-center"><Text.Label className="!text-slate-400">Aksi</Text.Label></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                            <Text.Caption className="font-bold uppercase tracking-widest">Sinkronisasi Data...</Text.Caption>
                                        </div>
                                    </td>
                                </tr>
                            ) : displayedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <ArrowDownRight weight="duotone" className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <div>
                                                <Text.H2>Data Tidak Ditemukan</Text.H2>
                                                <Text.Caption className="mt-1">Belum ada riwayat transaksi yang tersedia.</Text.Caption>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayedTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <Text.H2 className="!text-slate-900">{dateUtils.toDisplay(trx.tanggal)}</Text.H2>
                                            <Text.Caption className="italic mt-0.5">ID: {formatFormalId(trx.tanggal, trx.id)}</Text.Caption>
                                        </td>
                                        <td className="p-4">
                                            <Text.Label className={`block mb-1.5 !tracking-normal ${trx.tipe === 'pemasukan' ? '!text-brand-600' : '!text-red-500'}`}>
                                                {toTitleCase(trx.kategori)}
                                            </Text.Label>
                                            {(() => {
                                                const parsed = parseKeterangan(trx.keterangan);
                                                return (
                                                    <div className="space-y-1">
                                                        {parsed.isIuran && parsed.wargaNama ? (
                                                            <>
                                                                <span className="inline-flex px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[11px] font-bold border border-brand-100/50 uppercase tracking-tight">
                                                                    {parsed.wargaNama}
                                                                </span>
                                                                <Text.Caption className="block font-medium">{parsed.period}</Text.Caption>
                                                            </>
                                                        ) : (
                                                            <Text.Body className="truncate max-w-xs !text-slate-800" title={trx.keterangan}>
                                                                {parsed.label}
                                                            </Text.Body>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {trx.tipe === 'pemasukan' ? (
                                                <Text.Amount className="!text-brand-600 font-bold">{formatRupiah(trx.nominal)}</Text.Amount>
                                            ) : (
                                                <Text.Amount className="!text-slate-200">Rp 0</Text.Amount>
                                            )}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {trx.tipe === 'pengeluaran' ? (
                                                <Text.Amount className="!text-red-500 font-bold">{formatRupiah(trx.nominal)}</Text.Amount>
                                            ) : (
                                                <Text.Amount className="!text-slate-200">Rp 0</Text.Amount>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                {trx.url_bukti ? (
                                                    <button
                                                        onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                        className="p-2.5 text-brand-600 bg-white hover:bg-brand-50 rounded-[12px] border border-slate-200 hover:border-brand-200 transition-all shadow-premium"
                                                        title="Lihat Bukti"
                                                    >
                                                        <ImageIcon weight="bold" className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <Text.Caption className="opacity-30">—</Text.Caption>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!isWarga && (
                                                    <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(trx.id)}
                                                            className="p-2.5 text-red-500 bg-white hover:bg-red-50 rounded-[12px] border border-slate-200 hover:border-red-200 transition-all shadow-premium"
                                                            title="Hapus Transaksi"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* MOBILE VIEW: CHRONOLOGICAL LIST */}
                <div className="md:hidden divide-y divide-slate-50 bg-white">
                    {isLoading ? (
                        <div className="py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                <Text.Caption className="font-bold uppercase tracking-widest">Sinkronisasi...</Text.Caption>
                            </div>
                        </div>
                    ) : displayedTransactions.length === 0 ? (
                        <div className="rounded-[20px] p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center">
                                <ArrowDownRight weight="duotone" className="w-10 h-10 text-slate-200" />
                            </div>
                            <Text.H2>Belum Ada Transaksi</Text.H2>
                        </div>
                    ) : (
                        displayedTransactions
                            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                            .map((trx) => {
                                const parsed = parseKeterangan(trx.keterangan);
                                return (
                                    <div key={trx.id} className="border-b border-slate-50 last:border-0">
                                        <div 
                                            onClick={() => setExpandedId(expandedId === trx.id ? null : trx.id)}
                                            className={`p-5 transition-all duration-300 active:bg-slate-100 cursor-pointer ${expandedId === trx.id ? 'bg-slate-50/80 shadow-inner' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-4 min-w-0">
                                                    <div className={`w-12 h-12 rounded-[16px] shrink-0 flex flex-col items-center justify-center border shadow-sm ${trx.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-600 border-rose-100/50'}`}>
                                                        <span className={`text-[9px] font-bold uppercase leading-none ${trx.tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>{new Date(trx.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold leading-none mt-0.5">{new Date(trx.tanggal).getDate()}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${trx.tipe === 'pemasukan' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                                {trx.tipe === 'pemasukan' ? 'Masuk' : 'Keluar'}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight truncate opacity-60">ID: {formatFormalId(trx.tanggal, trx.id)}</span>
                                                        </div>
                                                        <Text.H2 className="!font-medium line-clamp-1 !text-slate-900 !leading-snug">{toTitleCase(trx.kategori)}</Text.H2>
                                                        <p className="text-[12px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                                            {parsed.wargaNama ? (
                                                                <><span className="font-bold text-brand-600">{parsed.wargaNama}</span> {parsed.isIuran && '— Iuran'}</>
                                                            ) : (
                                                                parsed.label || "Tanpa Keterangan"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 gap-1.5 pt-1">
                                                    <div className={`text-base font-normal tabular-nums tracking-tighter ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {trx.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {trx.url_bukti && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedProof(trx.url_bukti || null); }}
                                                                className="p-1.5 text-brand-600 bg-brand-50 rounded-lg border border-brand-100 transition-opacity hover:opacity-70"
                                                            >
                                                                <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {!isWarga && (
                                                            <HasPermission module="Buku Kas / Transaksi" action="Ubah">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/keuangan/edit/${trx.id}`); }}
                                                                    className="p-1.5 text-slate-400 bg-white rounded-lg border border-slate-200 transition-all active:scale-90"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-3.5 h-3.5" />
                                                                </button>
                                                            </HasPermission>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedId === trx.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col gap-1 text-left">
                                                            <Text.Caption className="!text-[10px] !font-bold uppercase tracking-tight text-slate-400">Keterangan Lengkap</Text.Caption>
                                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{parsed.raw}</p>
                                                        </div>

                                                        {parsed.isIuran && (
                                                            <div className="flex flex-col gap-2 text-left">
                                                                <Text.Caption className="!text-[10px] !font-bold tracking-tight text-brand-600">Bulan Dibayar ({parsed.year})</Text.Caption>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {(() => {
                                                                        const allMonthsPlayedByCitizen = transactions
                                                                            .filter(t => {
                                                                                const p = parseKeterangan(t.keterangan);
                                                                                return p.wargaNama === parsed.wargaNama && p.year === parsed.year && p.isIuran;
                                                                            })
                                                                            .flatMap(t => parseKeterangan(t.keterangan).months);

                                                                        return ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'].map((m, idx) => {
                                                                            const monthNum = idx + 1;
                                                                            const isCurrent = parsed.months.includes(monthNum);
                                                                            const isPaid = allMonthsPlayedByCitizen.includes(monthNum);
                                                                            
                                                                            let colorStates = "bg-rose-50 text-rose-500 border border-rose-100/50 opacity-100 font-medium"; // Unpaid (Smooth Red Card)
                                                                            if (isCurrent) {
                                                                                colorStates = "bg-brand-600 text-white shadow-sm border-brand-500 scale-110 z-10 font-black";
                                                                            } else if (isPaid) {
                                                                                colorStates = "bg-blue-50 text-blue-500 border border-blue-100 font-bold opacity-100";
                                                                            }

                                                                            return (
                                                                                <span 
                                                                                    key={m}
                                                                                    className={`px-2 py-1 rounded-lg text-[9px] transition-all tracking-tighter ${colorStates}`}
                                                                                >
                                                                                    {m}
                                                                                </span>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>
                </>
            ) : (
                <div className="space-y-4 animate-fade-in pb-10">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex flex-col">
                            <Text.Label className="font-bold opacity-80 !text-[11px] text-slate-600">Periode Laporan</Text.Label>
                            <Text.H2 className="!text-slate-900 !tracking-tight">
                                {statFilterType === 'THIS_MONTH' ? dateUtils.toDisplay(new Date()).split(' ').slice(1).join(' ') : (statFilterType === 'THIS_YEAR' ? new Date().getFullYear() : 'Kustom Range')}
                            </Text.H2>
                        </div>
                        
                        <div className="relative" ref={statFilterRef}>
                            <button 
                                onClick={() => setIsStatFilterOpen(!isStatFilterOpen)}
                                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-white shadow-sm border border-slate-100 text-brand-600 hover:bg-brand-50 hover:border-brand-100"
                            >
                                <Funnel weight="fill" className="w-4 h-4" />
                            </button>

                            {isStatFilterOpen && (
                                <div className="absolute top-12 right-0 z-[100] w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 animate-in zoom-in-95 duration-200">
                                    <div className="space-y-1">
                                        {[
                                            { id: 'THIS_MONTH', label: 'Bulan Ini' },
                                            { id: 'THIS_YEAR', label: 'Tahun Ini' },
                                            { id: 'CUSTOM', label: 'Pilih Sendiri' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setStatFilterType(opt.id as FilterType);
                                                    if (opt.id !== 'CUSTOM') setIsStatFilterOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${statFilterType === opt.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <span>{opt.label}</span>
                                                {statFilterType === opt.id && <CheckCircle weight="fill" className="w-4 h-4 text-brand-600" />}
                                            </button>
                                        ))}
                                    </div>

                                    {statFilterType === 'CUSTOM' && (
                                        <div className="mt-2 p-3 bg-slate-50 rounded-xl space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-widest">Mulai</label>
                                                <input 
                                                    type="date" 
                                                    value={statCustomRange.start}
                                                    onChange={(e) => setStatCustomRange({ ...statCustomRange, start: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 pl-1 tracking-widest">Selesai</label>
                                                <input 
                                                    type="date" 
                                                    value={statCustomRange.end}
                                                    onChange={(e) => setStatCustomRange({ ...statCustomRange, end: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => setIsStatFilterOpen(false)}
                                                className="w-full py-2 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 transition-colors"
                                            >
                                                Terapkan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-0.5">
                        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-brand-200 transition-all group">
                            <Text.Label className="font-bold opacity-80 !text-[10px] text-slate-500 uppercase tracking-widest">Target Bulanan</Text.Label>
                            <Text.Amount className="text-xl font-black text-slate-900">{formatRupiah(statistics.target)}</Text.Amount>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${Math.min(statistics.status, 100)}%`,
                                        backgroundColor: statistics.statusColor
                                    }}
                                />
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-emerald-200 transition-all">
                            <Text.Label className="font-bold opacity-80 !text-[10px] text-slate-500 uppercase tracking-widest">Realisasi Bulanan</Text.Label>
                            <Text.Amount className="text-xl font-black text-emerald-600">{formatRupiah(statistics.realisasi)}</Text.Amount>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${statistics.statusBg}`}>
                                    {statistics.statusLabel} {statistics.status.toFixed(0)}%
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-blue-200 transition-all">
                            <Text.Label className="font-bold opacity-80 !text-[10px] text-slate-500 uppercase tracking-widest">Iuran Insidentil</Text.Label>
                            <Text.Amount className="text-xl font-black text-blue-600">{formatRupiah(statistics.incidentalIncome)}</Text.Amount>
                            <Text.Caption className="!text-[9px] !font-bold text-slate-400 mt-2 uppercase">Luar Kewajiban Rutin</Text.Caption>
                        </div>
                    </div>

                    {/* Breakdown Detail Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pemasukan Breakdown */}
                        <div className="bg-white rounded-[32px] p-6 shadow-premium border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Detail Pemasukan</h3>
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                    <ArrowDownRight weight="bold" className="w-4 h-4 text-emerald-600 rotate-180" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-500">Kewajiban Bulanan</span>
                                    <span className="text-xs font-black text-slate-900">{formatRupiah(statistics.realisasi)}</span>
                                </div>
                                <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-500">Iuran Acara / Insidentil</span>
                                    <span className="text-xs font-black text-slate-900">{formatRupiah(statistics.incidentalIncome)}</span>
                                </div>
                                <div className="pt-2 flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Masuk</span>
                                    <span className="text-lg font-black text-emerald-600">{formatRupiah(statistics.realisasi + statistics.incidentalIncome)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pengeluaran Breakdown */}
                        <div className="bg-white rounded-[32px] p-6 shadow-premium border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Detail Pengeluaran</h3>
                                <div className="p-2 bg-rose-50 rounded-xl">
                                    <ArrowDownRight weight="bold" className="w-4 h-4 text-rose-600" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-500">Kegiatan & Agenda</span>
                                    <span className="text-xs font-black text-rose-600">{formatRupiah(statistics.agendaExpenses)}</span>
                                </div>
                                <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <span className="text-xs font-bold text-slate-500">Operasional & Umum</span>
                                    <span className="text-xs font-black text-slate-900">{formatRupiah(displayedSummary.kasKeluar - statistics.agendaExpenses)}</span>
                                </div>
                                <div className="pt-2 flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Keluar</span>
                                    <span className="text-lg font-black text-rose-600">{formatRupiah(displayedSummary.kasKeluar)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SALDO CARD */}
                    <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110 duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 opacity-80">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <Coins weight="fill" className="w-4 h-4 text-brand-200" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Saldo Kas Akhir</span>
                                </div>
                                <Text.Amount className="!text-white !text-5xl !tracking-tighter !leading-none font-black drop-shadow-sm">
                                    {formatRupiah(displayedSummary.saldo)}
                                </Text.Amount>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl rounded-[24px] p-5 border border-white/20 shadow-inner">
                                <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-2 text-center md:text-left">Status Keuangan</p>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${displayedSummary.saldo >= 0 ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-rose-400 shadow-[0_0_12px_#f87171]'} animate-pulse`} />
                                    <span className="text-base font-black tracking-tight">{displayedSummary.saldo >= 0 ? 'Surplus / Sehat' : 'Defisit / Perhatian'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedProof && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative max-w-4xl w-full bg-white rounded-[24px] shadow-2xl overflow-hidden animate-zoom-in">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <Text.H2>Bukti Transaksi</Text.H2>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X weight="bold" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-10 flex justify-center bg-slate-100 max-h-[80vh] overflow-y-auto">
                            <img
                                src={getFullUrl(selectedProof)}
                                alt="Bukti Transaksi"
                                className="max-w-full h-auto rounded-[16px] shadow-premium"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
