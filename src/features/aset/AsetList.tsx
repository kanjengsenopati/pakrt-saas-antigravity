import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { asetService } from '../../services/asetService';
import { wargaService } from '../../services/wargaService';
import { useAuth } from '../../contexts/AuthContext';
import { Aset, Warga } from '../../database/db';
import { 
    Plus, 
    PencilSimple, 
    Trash, 
    Package, 
    Handshake, 
    ArrowUUpLeft, 
    Image as ImageIcon, 
    X, 
    CircleNotch, 
    MagnifyingGlass,
    CalendarCheck,
    Clock,
    CheckCircle,
    Info
} from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { dateUtils } from '../../utils/date';
import { useHybridData } from '../../hooks/useHybridData';
import { Text } from '../../components/ui/Typography';
import { toTitleCase } from '../../utils/text';

type TabType = 'daftar' | 'booking';

export default function AsetList() {
    const { currentTenant, currentScope } = useTenant();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role !== 'WARGA';

    const [activeTab, setActiveTab] = useState<TabType>('daftar');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCondition, setFilterCondition] = useState<string>('');
    
    // Modals
    const [borrowModalOpen, setBorrowModalOpen] = useState(false);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    
    const [selectedAset, setSelectedAset] = useState<Aset | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [selectedWargaId, setSelectedWargaId] = useState('');
    const [bookingForm, setBookingForm] = useState({
        tanggal_mulai: '',
        tanggal_selesai: '',
        keperluan: ''
    });
    const [catatanAdmin, setCatatanAdmin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data Fetching
    const { 
        mergedData: asetItems, 
        isFetching: isAsetLoading, 
        refresh: loadAset 
    } = useHybridData<Aset[]>({
        fetcher: () => asetService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const { 
        mergedData: wargaServerData, 
        isFetching: isWargaLoading 
    } = useHybridData<{ items: Warga[] }>({
        fetcher: () => wargaService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant && isAdmin
    });

    const [bookings, setBookings] = useState<any[]>([]);
    const [isBookingsLoading, setIsBookingsLoading] = useState(false);

    const loadBookings = async () => {
        if (!currentTenant) return;
        setIsBookingsLoading(true);
        try {
            const data = await asetService.getAllBookings();
            setBookings(data);
        } catch (error) {
            console.error("Failed to load bookings:", error);
        } finally {
            setIsBookingsLoading(false);
        }
    };

    useEffect(() => {
        if (currentTenant && (activeTab === 'booking' || isAdmin)) {
            loadBookings();
        }
    }, [currentTenant, activeTab, isAdmin]);

    const asetList = asetItems || [];
    const wargaList = wargaServerData?.items || [];
    const isLoading = isAsetLoading || isWargaLoading;

    const API_URL = (import.meta as any).env.VITE_API_URL || '/api';
    const IMAGE_BASE_URL = API_URL.replace('/api', '');

    const handleDelete = async (id: string, namaBarang: string) => {
        if (window.confirm(`Hapus data aset ${namaBarang}?`)) {
            await asetService.delete(id);
            loadAset();
        }
    };

    const handleBorrowClick = (aset: Aset) => {
        setSelectedAset(aset);
        setSelectedWargaId('');
        setBorrowModalOpen(true);
    };

    const handleBookingClick = (aset: Aset) => {
        setSelectedAset(aset);
        setBookingForm({
            tanggal_mulai: new Date().toISOString().split('T')[0],
            tanggal_selesai: new Date().toISOString().split('T')[0],
            keperluan: ''
        });
        setBookingModalOpen(true);
    };

    const submitBorrow = async () => {
        if (!selectedAset || !selectedWargaId) return;
        setIsSubmitting(true);
        try {
            await asetService.update(selectedAset.id, {
                status_pinjam: 'dipinjam',
                peminjam_id: selectedWargaId,
                tanggal_pinjam: new Date().toISOString(),
                kondisi: selectedAset.kondisi
            });
            setBorrowModalOpen(false);
            loadAset();
        } catch (error) {
            console.error("Failed to borrow aset:", error);
            alert("Gagal memproses peminjaman.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitBooking = async () => {
        if (!selectedAset || !bookingForm.tanggal_mulai || !bookingForm.tanggal_selesai) return;
        setIsSubmitting(true);
        try {
            await asetService.createBooking({
                aset_id: selectedAset.id,
                warga_id: user?.warga_id,
                ...bookingForm
            });
            setBookingModalOpen(false);
            alert("Permintaan peminjaman berhasil dikirim! Silakan tunggu konfirmasi pengurus.");
            loadBookings();
        } catch (error) {
            console.error("Failed to create booking:", error);
            alert("Gagal mengirim permintaan booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBookingStatus = async (booking: any, status: 'APPROVED' | 'REJECTED') => {
        setSelectedBooking(booking);
        if (status === 'REJECTED') {
            setApproveModalOpen(true);
            return;
        }

        if (window.confirm(`Setujui peminjaman ${booking.aset.nama_barang} oleh ${booking.warga.nama}?`)) {
            try {
                await asetService.updateBookingStatus(booking.id, 'APPROVED');
                loadBookings();
            } catch (error) {
                console.error("Failed to update status", error);
            }
        }
    };

    const submitStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
        if (!selectedBooking) return;
        try {
            await asetService.updateBookingStatus(selectedBooking.id, status, catatanAdmin);
            setApproveModalOpen(false);
            setCatatanAdmin('');
            loadBookings();
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const handleReturn = async (aset: Aset) => {
        if (window.confirm(`Konfirmasi pengembalian aset: ${aset.nama_barang}?`)) {
            try {
                await asetService.update(aset.id, {
                    status_pinjam: 'tersedia',
                    peminjam_id: null as any,
                    tanggal_pinjam: null as any,
                    kondisi: aset.kondisi
                });
                loadAset();
            } catch (error) {
                console.error("Failed to return aset:", error);
                alert("Gagal memproses pengembalian.");
            }
        }
    };

    const filteredAset = useMemo(() => {
        return asetList.filter(a => {
            const matchesSearch = a.nama_barang.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCondition = filterCondition === '' || a.kondisi === filterCondition;
            return matchesSearch && matchesCondition;
        });
    }, [asetList, searchQuery, filterCondition]);

    return (
        <div className="space-y-6 animate-fade-in relative px-5 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Text.H1>Inventaris Aset</Text.H1>
                    <Text.Body>Kelola & pinjam fasilitas publik di <Text.Label component="span" className="!inline-flex !font-bold !text-brand-600 bg-brand-50 !px-2 !py-0.5 rounded-lg border border-brand-100">{currentScope}</Text.Label></Text.Body>
                </div>
                <HasPermission module="Aset" action="Buat">
                    <button
                        onClick={() => navigate('/aset/new')}
                        className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <Text.Body component="span" className="!text-white !font-bold">Tambah Aset</Text.Body>
                    </button>
                    
                    <button
                        onClick={() => navigate('/aset/new')}
                        className="md:hidden fixed bottom-28 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-[24px] border border-slate-200/60 w-full mb-1 gap-1.5 shadow-inner">
                <button
                    onClick={() => setActiveTab('daftar')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-[20px] transition-all duration-300 ${activeTab === 'daftar' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    <Package weight={activeTab === 'daftar' ? 'fill' : 'bold'} size={18} />
                    <Text.Body className="!font-bold !text-inherit">Daftar Aset</Text.Body>
                </button>
                <button
                    onClick={() => setActiveTab('booking')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-[20px] transition-all duration-300 ${activeTab === 'booking' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    <CalendarCheck weight={activeTab === 'booking' ? 'fill' : 'bold'} size={18} />
                    <Text.Body className="!font-bold !text-inherit">Booking {isAdmin && bookings.filter(b => b.status === 'PENDING').length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] rounded-full">{bookings.filter(b => b.status === 'PENDING').length}</span>}</Text.Body>
                </button>
            </div>

            {activeTab === 'daftar' ? (
                <>
                    {/* Filter Area */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Cari fasilitas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm font-medium"
                            />
                        </div>
                        <select
                            value={filterCondition}
                            onChange={e => setFilterCondition(e.target.value)}
                            className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-[20px] text-sm font-bold transition-all outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm cursor-pointer hover:bg-slate-50"
                        >
                            <option value="">Semua Kondisi</option>
                            <option value="baik">Kondisi Baik</option>
                            <option value="rusak_ringan">Rusak Ringan</option>
                            <option value="rusak_berat">Rusak Berat</option>
                        </select>
                    </div>

                    {/* Asset Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="bg-white rounded-[24px] p-4 h-64 animate-pulse border border-slate-100" />
                            ))
                        ) : filteredAset.length === 0 ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-[24px] flex items-center justify-center border-2 border-dashed border-slate-200 mb-4">
                                    <Package size={40} className="text-slate-300" />
                                </div>
                                <Text.H2>Tidak Ada Aset</Text.H2>
                                <Text.Body>Fasilitas yang Anda cari tidak ditemukan.</Text.Body>
                            </div>
                        ) : (
                            filteredAset.map((aset) => (
                                <div key={aset.id} className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-500 flex flex-col h-full">
                                    {/* Image Section */}
                                    <div className="relative h-48 overflow-hidden bg-slate-100">
                                        {aset.foto_barang ? (
                                            <img src={`${IMAGE_BASE_URL}${aset.foto_barang}`} alt={aset.nama_barang} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <ImageIcon size={48} weight="duotone" />
                                                <Text.Caption>Tidak Ada Foto</Text.Caption>
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${
                                                aset.kondisi === 'baik' ? 'bg-emerald-500 text-white border-emerald-400' :
                                                aset.kondisi === 'rusak_ringan' ? 'bg-amber-500 text-white border-amber-400' :
                                                'bg-rose-500 text-white border-rose-400'
                                            }`}>
                                                {aset.kondisi === 'baik' ? 'Baik' : toTitleCase(aset.kondisi).replace('_', ' ')}
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black border border-white/20 shadow-sm">
                                                {aset.jumlah} UNIT
                                            </div>
                                        </div>
                                        
                                        {/* Quick Actions (Admin Only) */}
                                        {isAdmin && (
                                            <div className="absolute top-3 right-3 flex gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                <button onClick={() => navigate(`/aset/edit/${aset.id}`)} className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors">
                                                    <PencilSimple weight="bold" size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(aset.id, aset.nama_barang)} className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors">
                                                    <Trash weight="bold" size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <Text.H2 className="!text-[16px] mb-1 line-clamp-1">{aset.nama_barang}</Text.H2>
                                            <Text.Caption className="flex items-center gap-1.5 !text-slate-400">
                                                <Info size={14} /> 
                                                {aset.vendor ? `Disediakan oleh ${aset.vendor}` : 'Fasilitas Umum'}
                                            </Text.Caption>
                                        </div>

                                        <div className="mt-auto space-y-4">
                                            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                                {aset.status_pinjam === 'dipinjam' ? (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                                                <Handshake weight="fill" size={20} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <Text.Label className="!text-amber-700 !text-[9px]">SEDANG DIPINJAM</Text.Label>
                                                                <Text.Body className="!font-bold !text-[12px] truncate">{toTitleCase(aset.peminjam?.nama || 'Unknown')}</Text.Body>
                                                            </div>
                                                        </div>
                                                        {isAdmin && (
                                                            <button onClick={() => handleReturn(aset)} className="p-2 bg-white text-brand-600 rounded-lg shadow-sm border border-slate-100 hover:bg-brand-50 transition-all active:scale-95">
                                                                <ArrowUUpLeft weight="bold" size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                <CheckCircle weight="fill" size={20} />
                                                            </div>
                                                            <div>
                                                                <Text.Label className="!text-emerald-700 !text-[9px]">STATUS</Text.Label>
                                                                <Text.Body className="!font-bold !text-[12px]">Tersedia</Text.Body>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => isAdmin ? handleBorrowClick(aset) : handleBookingClick(aset)} 
                                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                                                                isAdmin ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700' : 'bg-slate-900 text-white hover:bg-black'
                                                            }`}
                                                        >
                                                            {isAdmin ? 'PINJAMKAN' : 'BOOKING'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                /* Booking Tab */
                <div className="space-y-4">
                    {isBookingsLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <CircleNotch size={40} className="animate-spin text-brand-500" />
                            <Text.Body>Memuat data booking...</Text.Body>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[24px] border-2 border-dashed border-slate-200">
                            <CalendarCheck size={48} className="text-slate-300 mb-4" />
                            <Text.H2>Belum Ada Booking</Text.H2>
                            <Text.Body>Semua permintaan peminjaman akan muncul di sini.</Text.Body>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                                                {booking.aset.foto_barang ? (
                                                    <img src={`${IMAGE_BASE_URL}${booking.aset.foto_barang}`} className="w-full h-full object-cover" />
                                                ) : <Package size={32} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Text.H2 className="!text-[15px]">{booking.aset.nama_barang}</Text.H2>
                                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                                        booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        booking.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        booking.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        {booking.status}
                                                    </div>
                                                </div>
                                                <Text.Body className="!text-xs !font-bold flex items-center gap-1">
                                                    <Handshake size={14} className="text-slate-400" /> {booking.warga.nama}
                                                </Text.Body>
                                                <div className="mt-2 flex items-center gap-4 text-slate-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        <Text.Caption className="!italic">{dateUtils.toDisplay(booking.tanggal_mulai)} — {dateUtils.toDisplay(booking.tanggal_selesai)}</Text.Caption>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:self-center">
                                            {isAdmin && booking.status === 'PENDING' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateBookingStatus(booking, 'APPROVED')}
                                                        className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                                    >
                                                        SETUJUI
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateBookingStatus(booking, 'REJECTED')}
                                                        className="flex-1 md:flex-none px-4 py-2.5 bg-white text-rose-600 border border-rose-100 rounded-xl text-xs font-black hover:bg-rose-50 active:scale-95 transition-all"
                                                    >
                                                        TOLAK
                                                    </button>
                                                </>
                                            )}
                                            {!isAdmin && booking.status === 'PENDING' && (
                                                <button className="text-slate-400 text-xs font-bold italic">Menunggu Konfirmasi...</button>
                                            )}
                                            {booking.status !== 'PENDING' && (
                                                <div className="text-right">
                                                    <Text.Caption className="!font-bold">{booking.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}</Text.Caption>
                                                    {booking.catatan_admin && <Text.Caption className="!text-[10px] block max-w-[200px] italic">"{booking.catatan_admin}"</Text.Caption>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {booking.keperluan && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <Text.Label className="!text-[9px] mb-1 opacity-50 uppercase">Keperluan:</Text.Label>
                                            <Text.Body className="!text-[12px] !font-medium">"{booking.keperluan}"</Text.Body>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Peminjaman (ADMIN ONLY - Direct) */}
            {borrowModalOpen && selectedAset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Text.H1 className="!text-xl">Pinjamkan Aset</Text.H1>
                                    <Text.Caption>Pencatatan langsung oleh pengurus</Text.Caption>
                                </div>
                                <button onClick={() => setBorrowModalOpen(false)} className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={20} weight="bold" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 bg-brand-50 p-4 rounded-2xl border border-brand-100">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-sm">
                                    <Package size={24} weight="duotone" />
                                </div>
                                <div>
                                    <Text.H2 className="!text-sm">{selectedAset.nama_barang}</Text.H2>
                                    <Text.Caption>Kondisi: {toTitleCase(selectedAset.kondisi)}</Text.Caption>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <Text.Label className="mb-2 block ml-1">PILIH WARGA PEMINJAM</Text.Label>
                                <select 
                                    value={selectedWargaId}
                                    onChange={e => setSelectedWargaId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-500/20 outline-none"
                                >
                                    <option value="">-- Pilih Warga --</option>
                                    {wargaList.map(w => (
                                        <option key={w.id} value={w.id}>{toTitleCase(w.nama)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setBorrowModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">BATAL</button>
                                <button 
                                    onClick={submitBorrow}
                                    disabled={!selectedWargaId || isSubmitting}
                                    className="flex-[2] py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'PROSES...' : 'KONFIRMASI'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Booking (WARGA) */}
            {bookingModalOpen && selectedAset && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Text.H1 className="!text-xl !text-white">Reservasi Aset</Text.H1>
                                    <Text.Caption className="!text-slate-400">Ajukan peminjaman fasilitas</Text.Caption>
                                </div>
                                <button onClick={() => setBookingModalOpen(false)} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
                                    <X size={20} weight="bold" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white shadow-sm">
                                    <CalendarCheck size={24} weight="duotone" />
                                </div>
                                <div>
                                    <Text.H2 className="!text-sm !text-white">{selectedAset.nama_barang}</Text.H2>
                                    <Text.Caption className="!text-slate-400">Tersedia {selectedAset.jumlah} unit</Text.Caption>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Text.Label className="mb-2 block ml-1">TANGGAL MULAI</Text.Label>
                                    <input 
                                        type="date" 
                                        value={bookingForm.tanggal_mulai}
                                        onChange={e => setBookingForm({...bookingForm, tanggal_mulai: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <Text.Label className="mb-2 block ml-1">TANGGAL SELESAI</Text.Label>
                                    <input 
                                        type="date" 
                                        value={bookingForm.tanggal_selesai}
                                        onChange={e => setBookingForm({...bookingForm, tanggal_selesai: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <Text.Label className="mb-2 block ml-1">KEPERLUAN</Text.Label>
                                <textarea 
                                    placeholder="Contoh: Acara hajatan, rapat warga, dll"
                                    value={bookingForm.keperluan}
                                    onChange={e => setBookingForm({...bookingForm, keperluan: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium h-24 outline-none"
                                />
                            </div>
                            <button 
                                onClick={submitBooking}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all active:scale-95 mt-4 disabled:opacity-50"
                            >
                                {isSubmitting ? 'MENGIRIM...' : 'KIRIM PERMINTAAN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Reject / Approve with Note (ADMIN) */}
            {approveModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100">
                            <Text.H1 className="!text-xl">Konfirmasi Penolakan</Text.H1>
                            <Text.Caption>Berikan alasan mengapa permintaan ditolak</Text.Caption>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <Text.Label className="mb-2 block ml-1">ALASAN / CATATAN</Text.Label>
                                <textarea 
                                    placeholder="Contoh: Barang sudah dibooking warga lain, atau sedang dalam perawatan."
                                    value={catatanAdmin}
                                    onChange={e => setCatatanAdmin(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium h-32 outline-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setApproveModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">BATAL</button>
                                <button 
                                    onClick={() => submitStatusUpdate('REJECTED')}
                                    className="flex-[2] py-3 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-700"
                                >
                                    TOLAK PERMINTAAN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

