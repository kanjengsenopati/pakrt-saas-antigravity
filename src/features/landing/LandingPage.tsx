import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle, Users, CurrencyCircleDollar,
    ArrowRight, MapPinLine,
    ChartLineUp, Wallet, Bell, MagnifyingGlass, House, Envelope,
    Article, Calendar, Package, Heart, Flashlight, Megaphone, CaretDown, CaretUp, Buildings, SignIn
} from '@phosphor-icons/react';
import { useTenant } from '../../contexts/TenantContext';

export default function LandingPage() {
    const navigate = useNavigate();
    const { } = useTenant();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "Apakah sistem PAKRT ini aman?",
            answer: "Sangat aman. Setiap data Warga dan Keuangan antar-RT dipisahkan dengan sistem Multi-Pengelola yang terenkripsi di server awan (cloud), sehingga data antar RT tidak akan pernah tercampur atau bocor."
        },
        {
            question: "Apakah warga biasa (bukan pengurus) bisa mengakses aplikasi ini?",
            answer: "Tentu! PAKRT mengusung konsep Warga Self-Service. Warga memiliki portal login sendiri untuk melihat tagihan iuran bulanan, mengunggah bukti pembayaran mandiri, mengajukan pembuatan surat pengantar ke RT, dan melaporkan keluhan (fasilitas/keamanan) langsung dari HP masing-masing."
        },
        {
            question: "Lalu bagaimana jika ada warga yang gaptek atau lansia tanpa smartphone?",
            answer: "Tidak perlu khawatir. Meskipun ada sistem Self-Service, PAKRT menyediakan skema 'Jalur Offline'. Warga gaptek cukup lapor atau bayar iuran secara tunai ke bendahara RT, lalu Pengurus yang akan mencatatkan transaksinya ke dalam sistem atau mencetakkan surat pengantar untuk mereka."
        },
        {
            question: "Apakah format surat pengantar sudah sesuai dengan standar kelurahan?",
            answer: "Ya, kami menyediakan template surat standar nasional (Surat Pengantar RT/RW) yang secara otomatis terisi dengan data riil warga dari database. Template ini dicetak bersih siap bawa ke Kelurahan."
        },
        {
            question: "Bolehkah saya mencoba dulu sebelum membayar paket tahunan?",
            answer: "Tentu! Anda bisa menggunakan Paket 'RT Pemula' yang sepenuhnya Gratis dan valid selamanya untuk RT kecil (di bawah 50 KK). Atau coba Paket RT Aktif dengan Free Trial 14 hari."
        }
    ];

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-brand-500 selection:text-white">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                                <MapPinLine weight="bold" className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                                PAK<span className="text-brand-600">RT</span>
                            </span>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
                            <a href="#beranda" className="hover:text-brand-600 transition-colors">Beranda</a>
                            <a href="#fitur" className="hover:text-brand-600 transition-colors">Fitur</a>
                            <a href="#biaya" className="hover:text-brand-600 transition-colors">Paket Biaya</a>
                            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
                            <a href="#affiliate" className="hover:text-brand-600 transition-colors">Mitra Affiliate</a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-gray-900 font-semibold hover:text-brand-600 transition-colors px-4 py-2"
                            >
                                Masuk
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-brand-600 text-white font-bold px-6 py-2.5 rounded-full hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-500/40 transition-all active:scale-95"
                            >
                                Daftar Gratis
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="beranda" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-brand-100 rounded-full blur-[100px] opacity-60"></div>
                <div className="absolute top-60 left-0 -ml-20 w-[30rem] h-[30rem] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center -mt-[30px]">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-medium tracking-wide mb-8 animate-fade-in-up">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                        </span>
                        Aplikasi Manajemen RT #1 di Indonesia
                    </div>

                    <h1 className="text-[40px] md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        Urus Warga Lebih Cepat, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">
                            RT Anda Semakin Cerdas.
                        </span>
                    </h1>

                    <p className="max-w-3xl mx-auto text-xl text-gray-500 mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <span className="font-bold text-gray-900">PAKRT (Pengelolaan Administrasi & Keuangan Rukun Tetangga)</span> hadir karena kami peduli. Kelola administrasi persuratan, iuran warga, jadwal ronda, hingga laporan keuangan secara transparan, otomatis, dan terpusat dalam satu platform cloud.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <button
                            onClick={() => navigate('/register')}
                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-bold rounded-full hover:bg-black hover:shadow-xl hover:shadow-gray-900/30 transition-all group flex items-center justify-center gap-2 text-lg"
                        >
                            Coba Gratis Sekarang
                            <ArrowRight weight="bold" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-bold rounded-full hover:border-gray-300 hover:bg-gray-50 transition-all text-lg">
                            Pelajari Fitur
                        </button>
                    </div>

                    {/* Dashboard & Mobile Preview mockups */}
                    <div className="mt-20 relative mx-auto max-w-6xl animate-fade-in-up flex justify-center items-center" style={{ animationDelay: '400ms' }}>

                        {/* Desktop Mockup */}
                        <div className="relative z-10 w-full lg:w-4/5 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden p-2 lg:-translate-x-16 transform lg:-rotate-1 hover:rotate-0 transition-all duration-500">
                            <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-[16/9] flex relative text-left shadow-inner pointer-events-none select-none">
                                {/* Sidebar Mock */}
                                <div className="w-52 bg-gray-900 text-white flex flex-col pt-4 px-4 pb-0 hidden md:flex shrink-0">
                                    <div className="flex items-center gap-2 mb-8 mt-2 opacity-90 px-1">
                                        <div className="w-6 h-6 bg-brand-500 rounded flex items-center justify-center"><MapPinLine weight="bold" className="w-4 h-4 text-white" /></div>
                                        <span className="font-bold text-sm tracking-wide">PAKRT.</span>
                                    </div>
                                    <div className="space-y-1 flex-1 overflow-y-auto pr-2 pb-6" style={{ scrollbarWidth: 'none' }}>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2 px-1 text-left">Menu Utama</div>
                                        <div className="flex items-center gap-3 bg-brand-600 px-3 py-2 rounded-lg text-xs font-semibold shadow-inner mb-2"><House weight="fill" className="w-4 h-4" /> Dashboard</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Users weight="fill" className="w-4 h-4" /> Data Warga</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><CurrencyCircleDollar weight="fill" className="w-4 h-4" /> Keuangan</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Envelope weight="fill" className="w-4 h-4" /> Persuratan</div>

                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6 px-1 text-left">Modul Ekstra</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Article weight="fill" className="w-4 h-4" /> Notulensi Rapat</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Heart weight="fill" className="w-4 h-4" /> PKK & Dasa Wisma</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Calendar weight="fill" className="w-4 h-4" /> Agenda Kegiatan</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Package weight="fill" className="w-4 h-4" /> Manajemen Aset</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Flashlight weight="fill" className="w-4 h-4" /> Jaga Ronda</div>
                                        <div className="flex items-center gap-3 text-gray-400 px-3 py-2 text-xs font-medium hover:text-white rounded-lg"><Megaphone weight="fill" className="w-4 h-4" /> Pelaporan Warga</div>
                                    </div>
                                </div>
                                {/* Main Content Mock */}
                                <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                                    {/* Header Mock */}
                                    <div className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10">
                                        <div className="flex items-center gap-2 text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full w-48"><MagnifyingGlass className="w-3 h-3" /> <span className="text-[10px]">Cari data...</span></div>
                                        <div className="flex items-center gap-3"><Bell weight="fill" className="w-4 h-4 text-gray-300" /><div className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-[10px] font-bold border border-brand-200">A</div></div>
                                    </div>
                                    {/* Content Dashboard */}
                                    <div className="p-6 flex-1 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50/90 z-10 bottom-0 h-full pointer-events-none"></div>
                                        <h3 className="text-sm font-extrabold text-gray-800 mb-4 tracking-tight">Ringkasan Wilayah</h3>

                                        {/* Grid Cards */}
                                        <div className="grid grid-cols-3 gap-4 mb-6 relative z-0">
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                <div className="text-[9px] text-gray-400 font-bold mb-1 tracking-wider uppercase">Total Warga</div>
                                                <div className="text-xl font-bold text-gray-900 flex items-center gap-2">124 <span className="text-emerald-500 text-[10px] font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md"><ChartLineUp weight="bold" className="inline w-3 h-3 mr-0.5" /> 2 Baru</span></div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                                <div className="text-[9px] text-gray-400 font-bold mb-1 tracking-wider uppercase">Saldo Kas Utama</div>
                                                <div className="text-xl font-bold text-gray-900">Rp 4.520.000</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-100/50 relative overflow-hidden">
                                                <div className="absolute right-[-10px] bottom-[-10px] opacity-10"><CurrencyCircleDollar weight="fill" className="w-16 h-16 text-brand-500" /></div>
                                                <div className="text-[9px] text-gray-400 font-bold mb-1 tracking-wider uppercase relative">Iuran Bulan Ini</div>
                                                <div className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md inline-block font-bold relative">85% Terkumpul</div>
                                            </div>
                                        </div>

                                        {/* Activity & Chart container */}
                                        <div className="grid grid-cols-3 gap-4 h-[140px] relative z-0">
                                            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                                <div className="text-[9px] font-bold text-gray-400 mb-3 tracking-wider uppercase">Aktivitas Terbaru</div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center"><Wallet weight="duotone" className="w-3.5 h-3.5" /></div>
                                                            <div className="text-[11px] font-bold text-gray-700">Pembayaran Iuran Bpk. Budi</div>
                                                        </div>
                                                        <div className="text-[11px] font-bold text-emerald-600">+ Rp 50.000</div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center"><Envelope weight="duotone" className="w-3.5 h-3.5" /></div>
                                                            <div className="text-[11px] font-bold text-gray-700">Surat Pengantar Domisili</div>
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-400">10 Menit lalu</div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"><Users weight="duotone" className="w-3.5 h-3.5" /></div>
                                                            <div className="text-[11px] font-bold text-gray-700">Penambahan KK Baru Blok A2</div>
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-400">Hari ini</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-b from-brand-50/50 to-white rounded-xl shadow-sm border border-brand-100/50 p-4 flex flex-col justify-between overflow-hidden">
                                                <div className="text-[9px] font-bold text-brand-800 tracking-wider uppercase mb-1">Tren Kas Masuk</div>
                                                <div className="flex items-end gap-1 h-full pt-2 opacity-80">
                                                    <div className="w-full bg-brand-200 rounded-t-sm" style={{ height: '35%' }}></div>
                                                    <div className="w-full bg-brand-300 rounded-t-sm" style={{ height: '50%' }}></div>
                                                    <div className="w-full bg-brand-400 rounded-t-sm" style={{ height: '40%' }}></div>
                                                    <div className="w-full bg-brand-500 rounded-t-sm hover:bg-brand-600" style={{ height: '75%' }}></div>
                                                    <div className="w-full bg-brand-500 rounded-t-sm" style={{ height: '85%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Mockup (Self Service) */}
                        <div className="absolute z-20 top-1/2 -translate-y-[45%] right-0 hidden lg:block w-[280px] transform rotate-3 hover:rotate-0 hover:-translate-y-[48%] hover:scale-105 transition-all duration-500">
                            <div className="rounded-[40px] border-[8px] border-black bg-black shadow-2xl overflow-hidden shadow-brand-900/40 relative">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-30"></div>

                                <div className="bg-gray-50 w-full h-[580px] flex flex-col relative text-left select-none pointer-events-none overflow-hidden">
                                    {/* Mobile Header */}
                                    <div className="bg-brand-600 pt-10 pb-6 rounded-b-3xl px-5 text-white shadow-md relative z-20">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="text-[10px] text-brand-100 mb-1">Selamat datang, Warga!</div>
                                                <div className="font-bold text-sm">Bpk. Budi Santoso</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-brand-400 bg-brand-500 overflow-hidden text-center flex items-center justify-center text-xs font-bold shadow-inner">BS</div>
                                        </div>
                                        <div className="bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm">
                                            <div className="text-[10px] text-brand-100 mb-1 opacity-90">Tagihan Iuran Anda Bulan Ini</div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-lg font-bold">Rp 50.000</div>
                                                <div className="text-[9px] font-bold bg-white text-brand-700 px-2 py-1 rounded-full shadow-sm hover:bg-gray-50 flex items-center gap-1">Bayar <ArrowRight weight="bold" className="w-2.5 h-2.5" /></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Quick Menus */}
                                    <div className="p-5 flex-1 overflow-y-auto relative z-10 -mt-2" style={{ scrollbarWidth: 'none' }}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-xs font-extrabold text-gray-800 tracking-wide uppercase">Layanan Mandiri</div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 mb-6">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
                                                    <Envelope weight="duotone" className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 text-center leading-tight">Minta<br />Surat</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-sm border border-red-100">
                                                    <Megaphone weight="duotone" className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 text-center leading-tight">Lapor<br />Masalah</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                                                    <CurrencyCircleDollar weight="duotone" className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 text-center leading-tight">Riwayat<br />Bayar</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm border border-purple-100">
                                                    <Calendar weight="duotone" className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-600 text-center leading-tight">Agenda<br />Warga</span>
                                            </div>
                                        </div>

                                        <div className="text-xs font-extrabold text-gray-800 mb-3 tracking-wide uppercase">Jadwal Ronda Anda</div>
                                        <div className="bg-slate-800 text-white p-3 rounded-xl flex items-center gap-4 shadow-sm relative overflow-hidden">
                                            <div className="absolute right-[-10px] top-[-10px] opacity-10"><Flashlight weight="fill" className="w-16 h-16 text-slate-400" /></div>
                                            <div className="w-10 h-10 bg-slate-700 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-600">
                                                <div className="text-[8px] uppercase tracking-wider text-brand-300">Sab</div>
                                                <div className="text-sm font-bold text-white">24</div>
                                            </div>
                                            <div className="relative z-10">
                                                <div className="font-bold text-xs mb-0.5 text-white">Malam Minggu Ini</div>
                                                <div className="text-[9px] text-slate-300">Pos 1 - Blok B (4 Warga)</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Bottom Nav */}
                                    <div className="h-16 bg-white border-t border-gray-100 flex items-center justify-around shrink-0 px-2 mt-auto pb-2 relative z-20">
                                        <div className="flex flex-col items-center gap-1 text-brand-600">
                                            <House weight="fill" className="w-5 h-5" />
                                            <span className="text-[8px] font-bold">Beranda</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 text-gray-400">
                                            <Article weight="fill" className="w-5 h-5" />
                                            <span className="text-[8px] font-bold">Aktivitas</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 text-gray-400 relative">
                                            <div className="absolute top-0 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                                            <Bell weight="fill" className="w-5 h-5" />
                                            <span className="text-[8px] font-bold">Notif</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 text-gray-400">
                                            <Users weight="fill" className="w-5 h-5" />
                                            <span className="text-[8px] font-bold">Profil</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Demo Login Quick Access Section */}
            <section className="py-12 bg-gray-50/50 border-y border-gray-100 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-brand-900/5 border border-brand-100">
                        <div className="max-w-md text-center md:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wider mb-4 border border-brand-100">
                                <Flashlight weight="fill" className="w-4 h-4" /> Quick Demo Login
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Coba Demo Sistem Sekarang</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Gunakan kredensial di samping untuk masuk ke <strong>RT 100 SendangMulyo</strong> dengan berbagai hak akses untuk merasakan pengalaman penuh PAKRT.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                            >
                                Pergi ke Halaman Login <ArrowRight weight="bold" />
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            {[
                                { role: 'Ketua RT', email: 'ketuart@pakrt.id', pass: 'password123', icon: <House weight="duotone" className="w-6 h-6 text-brand-600" />, bg: 'bg-brand-50' },
                                { role: 'Sekretaris', email: 'sekretaris@pakrt.id', pass: 'password123', icon: <Article weight="duotone" className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
                                { role: 'Bendahara', email: 'bendahara@pakrt.id', pass: 'password123', icon: <Wallet weight="duotone" className="w-6 h-6 text-emerald-600" />, bg: 'bg-emerald-50' },
                                { role: 'Warga', email: 'warga@pakrt.id', pass: 'password123', icon: <Users weight="duotone" className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50' },
                            ].map((user, i) => (
                                <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group flex items-center gap-4">
                                    <div className={`w-12 h-12 ${user.bg} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                                        {user.icon}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{user.role}</div>
                                        <div className="text-xs font-bold text-gray-900 mb-1 truncate">{user.email}</div>
                                        <div className="text-[10px] text-gray-500 font-medium">Password: <span className="font-mono bg-gray-200 px-1 py-0.5 rounded text-gray-700">{user.pass}</span></div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigate('/login');
                                        }}
                                        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:text-brand-600 hover:border-brand-200"
                                    >
                                        <SignIn weight="bold" className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="fitur" className="py-24 bg-gray-50 border-t border-gray-100 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Title Card */}
                        <div className="md:col-span-2 lg:col-span-2 bg-brand-600 p-8 rounded-3xl shadow-lg border border-brand-500 overflow-hidden relative flex flex-col justify-center text-white group">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl transform group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-brand-400 opacity-20 rounded-full blur-2xl"></div>
                            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 relative z-10 leading-tight text-white">Fitur Lengkap<br />untuk Pengurus RT</h2>
                            <p className="text-brand-50 text-base md:text-lg relative z-10 max-w-sm">Tinggalkan cara lama yang manual. Beralih ke sistem digital yang praktis, aman, dan dapat diakses dari mana saja.</p>
                        </div>

                        {/* Feature 1 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-brand-600 transition-colors duration-300">
                                    <Users weight="duotone" className="w-6 h-6 text-brand-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Database Warga</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Kelola data warga, KK, dan domisili terpusat.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
                                    <CurrencyCircleDollar weight="duotone" className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Keuangan</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Warga bayar mandiri (Self-Service) & transparansi kas realtime.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors duration-300">
                                    <Envelope weight="duotone" className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Persuratan</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Pengajuan mandiri (Self-Service) & cetak otomatis format resmi.</p>
                        </div>

                        {/* Feature 4 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 transition-colors duration-300">
                                    <Article weight="duotone" className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Notulensi Rapat</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Rekam dan bagikan hasil keputusan musyawarah.</p>
                        </div>

                        {/* Feature 5 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-600 transition-colors duration-300">
                                    <CheckCircle weight="duotone" className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Kehadiran (Absensi)</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Pantau presensi warga di kegiatan lingkungan.</p>
                        </div>

                        {/* Feature 6 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-600 transition-colors duration-300">
                                    <Package weight="duotone" className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Manajemen Aset</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Inventarisir barang kepemilikan RT (Tenda, Kursi).</p>
                        </div>

                        {/* Feature 7 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-rose-600 transition-colors duration-300">
                                    <Heart weight="duotone" className="w-6 h-6 text-rose-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">PKK & Dasa Wisma</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Modul khusus program ibu-ibu & pendataan dusun.</p>
                        </div>

                        {/* Feature 8 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-cyan-600 transition-colors duration-300">
                                    <Calendar weight="duotone" className="w-6 h-6 text-cyan-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Agenda Kegiatan</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Jadwal kegiatan rutin bulanan & hari besar.</p>
                        </div>

                        {/* Feature 9 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-900 transition-colors duration-300">
                                    <Flashlight weight="duotone" className="w-6 h-6 text-slate-100 transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Jaga Ronda</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Rotasi otomatis penugasan Siskamling warga.</p>
                        </div>

                        {/* Feature 10 */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-brand-200 hover:-translate-y-2 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-600 transition-colors duration-300">
                                    <Megaphone weight="duotone" className="w-6 h-6 text-red-600 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Pelaporan Warga</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Portal aduan mandiri warga untuk fasilitas, keamanan, darurat.</p>
                        </div>

                        {/* RW / Kelurahan Integration Card (Full Width) */}
                        <div className="md:col-span-2 lg:col-span-4 bg-gray-900 rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-800 relative overflow-hidden mt-4 group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 opacity-10 rounded-full blur-[80px] group-hover:opacity-20 transition-all duration-700"></div>
                            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 justify-between">
                                {/* Left Content */}
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
                                        <div className="w-16 h-16 bg-gray-800 border border-gray-700 shrink-0 rounded-2xl flex items-center justify-center text-brand-400 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-500 shadow-lg">
                                            <Buildings weight="duotone" className="w-8 h-8" />
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/50 border border-brand-800 text-brand-300 text-xs font-bold tracking-wider uppercase w-fit">
                                            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                                            Ekosistem Terintegrasi
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-extrabold text-white mb-4 leading-tight text-left">Dashboard Agregasi RW & Kelurahan</h3>
                                    <p className="text-gray-400 text-left text-sm md:text-base leading-relaxed max-w-xl">
                                        PAKRT tidak hanya untuk level RT. <span className="text-white font-semibold">Tersedia Dashboard sentral khusus Pengurus RW dan Kelurahan</span> untuk memantau rekapitulasi data demografi warga, laporan keuangan, dan aktivitas dari seluruh RT di wilayahnya secara otomatis (Agregasi Data). Akses prioritas bagi aparatur desa <strong className="text-brand-300 uppercase">100% Gratis</strong>.
                                    </p>
                                </div>

                                {/* Right Mockup */}
                                <div className="w-full lg:w-[480px] shrink-0 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                                    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden ring-1 ring-white/10">
                                        {/* Mockup Header */}
                                        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                            </div>
                                            <div className="text-xs font-semibold text-gray-400 font-mono">DASHBOARD_RW_05</div>
                                            <div className="w-14"></div> {/* spacer */}
                                        </div>

                                        {/* Mockup Content */}
                                        <div className="p-5 bg-gray-800/50">
                                            <div className="grid grid-cols-3 gap-3 mb-5">
                                                <div className="bg-gray-900 rounded-xl p-3.5 border border-gray-700 shadow-inner">
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-wider">Total RT</div>
                                                    <div className="text-2xl font-bold text-white">12</div>
                                                </div>
                                                <div className="bg-gray-900 rounded-xl p-3.5 border border-gray-700 shadow-inner">
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 tracking-wider">Total Warga</div>
                                                    <div className="text-2xl font-bold text-white">1.840</div>
                                                </div>
                                                <div className="bg-brand-900/20 rounded-xl p-3.5 border border-brand-800/30 relative overflow-hidden shadow-inner">
                                                    <div className="text-[10px] text-brand-400 font-bold uppercase mb-1.5 tracking-wider">Total Kas</div>
                                                    <div className="text-lg font-bold text-brand-300">Rp 45.2M</div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aktivitas Terkini (Lintas RT)</div>
                                                    <div className="text-[9px] text-brand-400 bg-brand-900/30 px-2 py-0.5 rounded border border-brand-800/50">LIVE</div>
                                                </div>
                                                <div className="space-y-3.5">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3 text-gray-300">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                            <span className="font-medium"><span className="text-gray-500 font-mono text-xs mr-2">RT 03</span> Update Kas (+ Rp 1.2M)</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium">Baru saja</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3 text-gray-300">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                                            <span className="font-medium"><span className="text-gray-500 font-mono text-xs mr-2">RT 08</span> Laporan Keamanan Masuk</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium">12 mnt lalu</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3 text-gray-300">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                            <span className="font-medium"><span className="text-gray-500 font-mono text-xs mr-2">RT 01</span> Pendaftaran 2 KK Baru</span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 font-medium">1 jam lalu</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="biaya" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Harga Jujur & Transparan</h2>
                        <p className="text-lg text-gray-600">Pilih paket yang sesuai dengan jumlah warga di wilayah RT Anda.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Basic */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">RT Pemula</h3>
                            <p className="text-gray-500 mb-6">Cocok untuk perumahan kecil</p>
                            <div className="mb-8">
                                <span className="text-4xl font-extrabold text-gray-900">Gratis</span>
                                <span className="text-gray-500">/selamanya</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-left w-full">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Maksimal 50 Kepala Keluarga
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Database Keuangan
                                </li>
                                <li className="flex items-center gap-3 text-gray-400">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-gray-300 flex-shrink-0" />
                                    Surat Menyurat Otomatis
                                </li>
                            </ul>
                            <button onClick={() => navigate('/register')} className="w-full py-3 px-6 rounded-full font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors mt-auto">
                                Daftar Gratis
                            </button>
                        </div>

                        {/* Pro */}
                        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 flex flex-col items-center text-center shadow-2xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 transform -translate-y-1/2 bg-brand-500 text-white px-4 py-1.5 rounded-full text-sm font-bold tracking-wide">
                                PALING POPULER
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">RT Aktif</h3>
                            <p className="text-gray-400 mb-6">Standar lingkungan RT modern</p>
                            <div className="mb-8">
                                <span className="text-gray-400 mr-1">Rp</span>
                                <span className="text-4xl font-extrabold text-white">49.000</span>
                                <span className="text-gray-400">/bln</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-left w-full text-gray-300">
                                <li className="flex items-center gap-3">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Hingga 200 Kepala Keluarga
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Semua Fitur Tersedia
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Prioritas Support
                                </li>
                            </ul>
                            <button onClick={() => navigate('/register')} className="w-full py-3 px-6 rounded-full font-bold text-white bg-brand-600 hover:bg-brand-500 transition-colors mt-auto">
                                Coba 14 Hari Gratis
                            </button>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">RW/Klaster</h3>
                            <p className="text-gray-500 mb-6">Untuk wilayah sangat besar</p>
                            <div className="mb-8">
                                <span className="text-gray-400 mr-1">Rp</span>
                                <span className="text-4xl font-extrabold text-gray-900">99.000</span>
                                <span className="text-gray-500">/bln</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-left w-full">
                                <li className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Kepala Keluarga Tidak Dibatasi (Unlimited)
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Akses Multi-RT (Khusus RW)
                                </li>
                                <li className="flex items-center gap-3 text-gray-700">
                                    <CheckCircle weight="fill" className="w-5 h-5 text-brand-500 flex-shrink-0" />
                                    Dedicated Account Manager
                                </li>
                            </ul>
                            <button onClick={() => navigate('/register')} className="w-full py-3 px-6 rounded-full font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors mt-auto">
                                Mulai Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-24 bg-gray-50 border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h2>
                        <p className="text-lg text-gray-600">Masih ragu untuk mulai? Temukan jawaban untuk kekhawatiran Anda di bawah ini.</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'border-brand-500 shadow-lg' : 'border-gray-200 hover:border-brand-300'}`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                >
                                    <span className={`text-lg font-bold transition-colors ${openFaq === index ? 'text-brand-700' : 'text-gray-900'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${openFaq === index ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {openFaq === index ? (
                                            <CaretUp weight="bold" className="w-4 h-4" />
                                        ) : (
                                            <CaretDown weight="bold" className="w-4 h-4" />
                                        )}
                                    </div>
                                </button>
                                <div
                                    className={`px-6 text-gray-600 transition-all duration-300 ease-in-out overflow-hidden`}
                                    style={{
                                        maxHeight: openFaq === index ? '500px' : '0',
                                        paddingBottom: openFaq === index ? '1.25rem' : '0',
                                        opacity: openFaq === index ? 1 : 0
                                    }}
                                >
                                    <p className="leading-relaxed border-t border-gray-100 pt-4 mt-2">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Affiliate / CTA Section */}
            <section id="affiliate" className="py-24 bg-brand-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-white opacity-5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h2 className="text-4xl font-extrabold text-white mb-6">Program Mitra Affiliate</h2>
                    <p className="text-xl text-brand-100 max-w-2xl mx-auto mb-10">
                        Ajak RT sebelah menggunakan PAKRT dan dapatkan komisi recurring hingga 30% setiap bulannya secara otomatis!
                    </p>
                    <button className="px-8 py-4 bg-white text-brand-800 font-bold rounded-full hover:bg-gray-100 hover:shadow-xl transition-all text-lg">
                        Gabung Menjadi Mitra
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800 text-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center gap-2 mb-6 opacity-50">
                        <MapPinLine weight="bold" className="w-6 h-6" />
                        <span className="text-xl font-extrabold tracking-tight text-white">
                            PAKRT
                        </span>
                    </div>
                    <p className="mb-2 font-medium text-gray-400">Pengelolaan Administrasi & Keuangan Rukun Tetangga</p>
                    <p className="mb-4 text-xs">© {new Date().getFullYear()} PT PakRT Digital Teknologi. All rights reserved.</p>
                    <div className="flex justify-center space-x-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Syarat Ketentuan</a>
                        <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
                        <a href="#faq" className="hover:text-white transition-colors">Bantuan/FAQ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
