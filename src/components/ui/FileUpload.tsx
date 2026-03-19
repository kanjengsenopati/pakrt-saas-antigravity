import { useState, useRef } from 'react';
import { Camera, X, CircleNotch, TrashSimple, Eye, CloudArrowUp, Link, CheckCircle, GoogleDriveLogo, Image as ImageIcon } from '@phosphor-icons/react';

interface FileUploadProps {
    onUploadSuccess: (url: string) => void;
    onRemove?: (url: string) => void;
    onLoadingChange?: (isLoading: boolean) => void;
    label?: string;
    helperText?: string;
    existingUrls?: string[];
    multiple?: boolean;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const compressImage = (file: File, maxSizeKb = 800): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX_DIM = 1400;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
                    else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);

                let quality = 0.82;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length * 0.75 > maxSizeKb * 1024 && quality > 0.15) {
                    quality -= 0.08;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                if (dataUrl.length * 0.75 > MAX_SIZE_BYTES) {
                    reject('File terlalu besar bahkan setelah kompresi. Coba foto dengan resolusi lebih kecil.');
                } else {
                    resolve(dataUrl);
                }
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};

const normalizeGDriveUrl = (url: string): string => {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    return url;
};

export const FileUpload = ({
    onUploadSuccess,
    onRemove,
    onLoadingChange,
    label = 'Upload Foto',
    helperText = 'Format JPG, PNG atau WEBP (Maks. 2MB)',
    existingUrls = [],
    multiple = false
}: FileUploadProps) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'upload' | 'link'>('upload');
    const [driveLink, setDriveLink] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        const API_URL = (import.meta as any).env.VITE_API_URL || '/api';
        return `${API_URL.replace('/api', '')}${url}`;
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Hanya file gambar yang diperbolehkan (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setError(`Ukuran file ${(file.size / 1024 / 1024).toFixed(1)}MB melebihi batas 2MB.`);
            return;
        }

        setError(null);
        setIsProcessing(true);
        onLoadingChange?.(true);
        try {
            const compressed = await compressImage(file);
            onUploadSuccess(compressed);
        } catch (err: any) {
            setError(typeof err === 'string' ? err : 'Gagal memproses gambar. Coba file lain.');
        } finally {
            setIsProcessing(false);
            onLoadingChange?.(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDriveLinkSave = () => {
        if (!driveLink.trim()) return;
        const normalized = normalizeGDriveUrl(driveLink.trim());
        onUploadSuccess(normalized);
        setDriveLink(normalized);
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="space-y-3">
            {/* Header with tab toggle */}
            <div className="flex items-center justify-between gap-2">
                {label && (
                    <label className="block text-sm font-bold text-slate-700 tracking-tight">{label}</label>
                )}
                <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg ml-auto">
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${mode === 'upload' ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Camera className="w-3 h-3" /> Upload
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('link')}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${mode === 'link' ? 'bg-white shadow text-brand-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <GoogleDriveLogo className="w-3 h-3" /> G. Drive
                    </button>
                </div>
            </div>

            {mode === 'upload' ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                        {/* Existing image previews */}
                        {existingUrls.map((url, index) => (
                            <div
                                key={index}
                                className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group animate-in zoom-in-95 duration-200"
                            >
                                {url.startsWith('data:') || url.startsWith('http') ? (
                                    <img
                                        src={fullUrl(url)}
                                        alt={`Dokumentasi ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                        <Link className="w-6 h-6 text-blue-400" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <button
                                        type="button"
                                        onClick={() => setViewingImage(url)}
                                        className="p-2 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-xl transition-all"
                                        title="Lihat"
                                    >
                                        <Eye weight="bold" className="w-4 h-4" />
                                    </button>
                                    {onRemove && (
                                        <button
                                            type="button"
                                            onClick={() => onRemove(url)}
                                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl transition-all"
                                            title="Hapus"
                                        >
                                            <TrashSimple weight="bold" className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Upload trigger */}
                        {(multiple || existingUrls.length === 0) && (
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                onClick={() => !isProcessing && fileInputRef.current?.click()}
                                className={`
                                    relative w-28 h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden
                                    ${isProcessing ? 'bg-slate-50 border-slate-200 cursor-wait' :
                                        isDragging ? 'bg-brand-50 border-brand-500 scale-105 shadow-xl shadow-brand-100 ring-4 ring-brand-50' :
                                            'bg-slate-50/50 border-slate-300 hover:border-brand-500 hover:bg-white hover:shadow-lg hover:shadow-brand-100/50 group/trigger'}
                                `}
                            >
                                {isProcessing ? (
                                    <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                                        <CircleNotch className="w-7 h-7 text-brand-500 animate-spin" />
                                        <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Memproses</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 transition-all duration-300 transform group-hover/trigger:-translate-y-1">
                                        {isDragging ? (
                                            <CloudArrowUp weight="fill" className="w-9 h-9 text-brand-600 animate-bounce" />
                                        ) : (
                                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 group-hover/trigger:border-brand-200 group-hover/trigger:shadow-brand-100 transition-all">
                                                <Camera weight="duotone" className="w-5 h-5 text-slate-400 group-hover/trigger:text-brand-500" />
                                            </div>
                                        )}
                                        <span className={`text-[9px] font-black uppercase tracking-wider ${isDragging ? 'text-brand-700' : 'text-slate-400 group-hover/trigger:text-brand-600'}`}>
                                            {isDragging ? 'Lepas' : 'Pilih Foto'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-brand-400/5 opacity-0 group-hover/trigger:opacity-100 transition-opacity" />
                            </div>
                        )}
                    </div>

                    {/* Error & helper */}
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-left duration-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                    {helperText && !isDragging && !error && (
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-2 pl-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            {helperText} · Dikompres otomatis
                        </p>
                    )}
                    {existingUrls.length > 0 && !error && (
                        <div className="flex items-center gap-2 text-[10px] text-brand-600/70 font-black uppercase tracking-widest pl-1">
                            <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                            Hover foto untuk kontrol
                        </div>
                    )}
                </div>
            ) : (
                /* Google Drive Link Mode */
                <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-700 leading-relaxed">
                        <p className="font-bold flex items-center gap-1.5 mb-1"><GoogleDriveLogo className="w-3.5 h-3.5" /> Cara berbagi dari Google Drive:</p>
                        <ol className="list-decimal pl-4 space-y-0.5 text-blue-600">
                            <li>Buka file di Google Drive, klik kanan → <strong>Dapatkan link</strong></li>
                            <li>Atur akses: <strong>Siapa saja yang memiliki link → Penampil</strong></li>
                            <li>Salin link dan tempel di kolom di bawah, lalu klik <strong>Simpan</strong></li>
                        </ol>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={driveLink}
                                onChange={(e) => setDriveLink(e.target.value)}
                                placeholder="https://drive.google.com/file/d/..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleDriveLinkSave}
                            disabled={!driveLink.trim()}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                        >
                            Simpan
                        </button>
                    </div>
                    {existingUrls.length > 0 && existingUrls.some((u) => u.startsWith('http')) && (
                        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs">
                            <CheckCircle weight="fill" className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-emerald-700 font-medium flex-1 truncate">{existingUrls[existingUrls.length - 1]}</span>
                        </div>
                    )}
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                className="hidden"
                accept="image/*"
            />

            {/* Lightbox Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setViewingImage(null)}
                >
                    <div className="absolute inset-0 cursor-zoom-out" />
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-[10000] group"
                        onClick={(e) => { e.stopPropagation(); setViewingImage(null); }}
                    >
                        <X weight="bold" className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                    <div className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group/modal">
                            {viewingImage.includes('drive.google.com') ? (
                                <iframe
                                    src={fullUrl(viewingImage)}
                                    className="w-[80vw] h-[75vh] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border-4 border-white/5"
                                    title="Dokumen Preview"
                                />
                            ) : (
                                <img
                                    src={fullUrl(viewingImage)}
                                    alt="Preview Full"
                                    className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border-4 border-white/5 object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
