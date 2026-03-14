import { useState, useRef } from 'react';
import { Camera, X, CircleNotch, TrashSimple, Eye, CloudArrowUp, Image as ImageIcon } from '@phosphor-icons/react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface FileUploadProps {
    onUploadSuccess: (url: string) => void;
    onRemove?: (url: string) => void;
    onLoadingChange?: (isLoading: boolean) => void;
    label?: string;
    helperText?: string;
    existingUrls?: string[];
    multiple?: boolean;
}

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';
const IMAGE_BASE_URL = API_URL.replace('/api', '');

export const FileUpload = ({
    onUploadSuccess,
    onRemove,
    onLoadingChange,
    label = 'Upload Foto',
    helperText = 'Format JPG, PNG atau WEBP (Maks. 2MB)',
    existingUrls = [],
    multiple = false
}: FileUploadProps) => {
    const { token } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fullUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `${IMAGE_BASE_URL}${url}`;
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Hanya file gambar yang diperbolehkan.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('Ukuran file maksimal adalah 2MB.');
            return;
        }

        setError(null);
        setIsUploading(true);
        onLoadingChange?.(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
            });

            if (response.data && response.data.url) {
                onUploadSuccess(response.data.url);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setError('Gagal mengunggah foto. Silakan coba lagi.');
        } finally {
            setIsUploading(false);
            onLoadingChange?.(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    return (
        <div className="space-y-4">
            {label && (
                <div className="flex justify-between items-end">
                    <label className="block text-sm font-bold text-slate-700 tracking-tight">{label}</label>
                    {existingUrls.length > 0 && (
                        <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-brand-100">
                            {existingUrls.length} {multiple ? 'Files' : 'Foto'}
                        </span>
                    )}
                </div>
            )}

            <div className="flex flex-wrap gap-4">
                {/* Image Previews */}
                {existingUrls.map((url, index) => (
                    <div
                        key={index}
                        className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-100 shadow-sm group animate-in zoom-in-95 duration-200"
                    >
                        <img
                            src={fullUrl(url)}
                            alt={`Dokumentasi ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <button
                                type="button"
                                onClick={() => setViewingImage(url)}
                                className="p-2.5 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-xl backdrop-blur-md transition-all transform scale-90 group-hover:scale-100 duration-300 shadow-xl border border-white/20 hover:border-white"
                                title="Lihat Foto"
                            >
                                <Eye weight="bold" className="w-5 h-5" />
                            </button>
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(url)}
                                    className="p-2.5 bg-red-500/80 hover:bg-red-500 text-white rounded-xl backdrop-blur-md transition-all transform scale-90 group-hover:scale-100 duration-300 shadow-xl border border-red-400/50"
                                    title="Hapus"
                                >
                                    <TrashSimple weight="bold" className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Upload Trigger */}
                {(multiple || existingUrls.length === 0) && (
                    <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={`
                            relative w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden
                            ${isUploading ? 'bg-slate-50 border-slate-200 cursor-wait' :
                                isDragging ? 'bg-brand-50 border-brand-500 scale-105 shadow-xl shadow-brand-100 ring-4 ring-brand-50' :
                                    'bg-slate-50/50 border-slate-300 hover:border-brand-500 hover:bg-white hover:shadow-lg hover:shadow-brand-100/50 group/trigger'}
                        `}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                                <div className="relative">
                                    <CircleNotch className="w-8 h-8 text-brand-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-1 h-1 bg-brand-500 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest animate-pulse">Mengunggah</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1.5 transition-all duration-300 transform group-hover/trigger:-translate-y-1">
                                {isDragging ? (
                                    <CloudArrowUp weight="fill" className="w-10 h-10 text-brand-600 animate-bounce" />
                                ) : (
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 group-hover/trigger:border-brand-200 group-hover/trigger:shadow-brand-100 transition-all">
                                        <Camera weight="duotone" className="w-6 h-6 text-slate-400 group-hover/trigger:text-brand-500" />
                                    </div>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isDragging ? 'text-brand-700' : 'text-slate-400 group-hover/trigger:text-brand-600'}`}>
                                    {isDragging ? 'Lepas' : 'Pilih Foto'}
                                </span>
                            </div>
                        )}

                        {/* Interactive Sparkle effect or similar could be added here */}
                        <div className="absolute inset-0 bg-brand-400/5 opacity-0 group-hover/trigger:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleInputChange}
                className="hidden"
                accept="image/*"
            />

            {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-left duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">
                        {error}
                    </p>
                </div>
            )}

            {helperText && !isDragging && !error && (
                <p className="text-[10px] text-slate-400 font-bold flex items-center gap-2 pl-1">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    {helperText}
                </p>
            )}

            {existingUrls.length > 0 && !error && (
                <div className="flex items-center gap-2 text-[10px] text-brand-600/70 font-black uppercase tracking-widest pl-1">
                    <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                    Hover foto untuk kontrol
                </div>
            )}

            {/* Premium Lightbox Modal */}
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

                    <div className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                        <div className="relative group/modal">
                            <img
                                src={fullUrl(viewingImage)}
                                alt="Preview Full"
                                className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] border-4 border-white/5 object-contain"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 opacity-0 group-hover/modal:opacity-100 transition-all transform translate-y-4 group-hover/modal:translate-y-0">
                                <p className="text-white text-[10px] font-black uppercase tracking-widest text-center">Dokumentasi Terpilih</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
