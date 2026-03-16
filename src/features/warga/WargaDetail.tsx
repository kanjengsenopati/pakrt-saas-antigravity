import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFullUrl } from '../../utils/url';
import { Warga } from '../../database/db';
import { wargaService } from '../../services/wargaService';
import { ArrowLeft, PencilSimple, User, IdentificationCard, Phone, MapPin, Calendar, GraduationCap, Briefcase, FileText, X, MagnifyingGlassPlus, GenderIntersex, HandsPraying, House } from '@phosphor-icons/react';
import { dateUtils } from '../../utils/date';
import AnggotaKeluargaPanel from './AnggotaKeluargaPanel';

export default function WargaDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [warga, setWarga] = useState<Warga | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isZooming, setIsZooming] = useState(false);


    useEffect(() => {
        if (id) {
            wargaService.getById(id).then(data => {
                if (data) setWarga(data);
                setIsLoading(false);
            });
        }
    }, [id]);

    if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat profil...</div>;
    if (!warga) return <div className="p-8 text-center text-red-500 font-medium">Data Warga tidak ditemukan.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/warga')}
                        className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Detail Profil Warga</h1>
                </div>
                <button
                    onClick={() => navigate(`/warga/edit/${warga.id}`)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                >
                    <PencilSimple weight="bold" />
                    <span>Edit Profil</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-brand-50 rounded-full overflow-hidden border border-brand-100 flex items-center justify-center mb-4 shadow-inner">
                            {warga.avatar ? (
                                <img src={getFullUrl(warga.avatar)} alt={warga.nama} className="w-full h-full object-cover" />
                            ) : (
                                <User weight="duotone" className="w-12 h-12 text-brand-200" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{warga.nama}</h2>
                        <p className="text-gray-500 text-sm mt-1">{warga.nik}</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-200 uppercase">
                                Kepala Keluarga
                            </span>
                            {warga.status_penduduk && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${warga.status_penduduk === 'Tetap' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                    {warga.status_penduduk}
                                </span>
                            )}
                            {warga.status_rumah && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${warga.status_rumah === 'Dihuni' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {warga.status_rumah === 'Dihuni' ? 'Rumah Dihuni' : 'Rumah Kosong'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b border-gray-50 pb-2">Dokumen</h3>
                        {warga.url_kk ? (
                            <a
                                href={getFullUrl(warga.url_kk)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors group"
                            >
                                <FileText weight="duotone" className="w-5 h-5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">Kartu Keluarga (KK)</p>
                                    <p className="text-xs text-blue-500">Klik untuk melihat file asli</p>
                                </div>
                            </a>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-gray-100 rounded-lg text-center">
                                <p className="text-xs text-gray-400">Belum ada dokumen KK terunggah</p>
                            </div>
                        )}

                        {warga.url_kk && (warga.url_kk.startsWith('data:image') || warga.url_kk.match(/\.(jpeg|jpg|gif|png|svg)$/i) || warga.url_kk.includes('placeholder') || warga.url_kk.includes('placehold.co') || warga.url_kk.length > 50) && (
                            <div
                                className="mt-4 border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer"
                                onClick={() => setIsZooming(true)}
                            >
                                <img
                                    src={getFullUrl(warga.url_kk)}
                                    alt="Preview Dokumen"
                                    className="w-full h-auto object-cover max-h-48 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all">
                                        <MagnifyingGlassPlus className="w-6 h-6 text-brand-600" />
                                    </div>
                                </div>
                                <div className="p-2 bg-gray-50 text-[10px] text-gray-400 text-center border-t border-gray-50 absolute bottom-0 w-full">
                                    Klik untuk perbesar dokumen
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-900">Informasi Pribadi</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            <InfoItem icon={IdentificationCard} label="NIK" value={warga.nik} />
                            <InfoItem icon={Phone} label="Kontak / WhatsApp" value={warga.kontak || '-'} />
                            <InfoItem icon={GenderIntersex} label="Jenis Kelamin" value={warga.jenis_kelamin || '-'} />
                            <InfoItem icon={HandsPraying} label="Agama" value={warga.agama || '-'} />
                            <InfoItem
                                icon={Calendar}
                                label="Tempat, Tanggal Lahir"
                                value={`${warga.tempat_lahir || '-'}, ${dateUtils.toDisplay(warga.tanggal_lahir)}`}
                            />
                            <InfoItem icon={GraduationCap} label="Pendidikan Terakhir" value={warga.pendidikan || '-'} />
                            <InfoItem icon={Briefcase} label="Pekerjaan" value={warga.pekerjaan || '-'} />
                            <InfoItem icon={House} label="Status Rumah" value={warga.status_rumah || '-'} />
                            <InfoItem icon={MapPin} label="Alamat" value={warga.alamat} className="sm:col-span-2" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <AnggotaKeluargaPanel wargaId={warga.id} tenantId={warga.tenant_id} initialData={warga.anggota} />
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {isZooming && warga.url_kk && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 sm:p-8"
                    onClick={() => setIsZooming(false)}
                >
                    <button
                        className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors backdrop-blur-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsZooming(false);
                        }}
                    >
                        <X weight="bold" className="w-6 h-6" />
                    </button>
                    <div
                        className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-2xl animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={getFullUrl(warga.url_kk)}
                            alt="Kartu Keluarga Zoom"
                            className="max-w-full max-h-[90vh] object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoItem({ icon: Icon, label, value, className = "" }: { icon: any, label: string, value: string, className?: string }) {
    return (
        <div className={`flex gap-3 ${className}`}>
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon weight="duotone" className="w-5 h-5 text-gray-400" />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-gray-800 font-medium mt-0.5">{value}</p>
            </div>
        </div>
    );
}
