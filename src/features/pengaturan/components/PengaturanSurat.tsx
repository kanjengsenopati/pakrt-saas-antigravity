import React from 'react';
import { useFormContext } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import { Text } from '../../../components/ui/Typography';
import { FileText, Plus, X, Eraser, QrCode, FloppyDisk } from '@phosphor-icons/react';
import { QRCodeCanvas } from 'qrcode.react';
import { getFullUrl } from '../../../utils/url';
import { PengaturanFormData } from '../types';
import { HasPermission } from '../../../components/auth/HasPermission';

interface PengaturanSuratProps {
    currentScope: string;
    handleSyncOfficialKop: () => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    logoPreview: string | null;
    setLogoPreview: (v: string | null) => void;
    handleSyncOfficialSignatory: () => void;
    clearSignature: () => void;
    sigPad: React.RefObject<SignatureCanvas | null>;
    handleSignatureEnd: () => void;
    ttdPreview: string | null;
    handleStempelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    stempelPreview: string | null;
    handleRemoveStempel: () => void;
    isSaving: boolean;
    isUploading: boolean;
}

export default function PengaturanSurat({
    currentScope,
    handleSyncOfficialKop,
    handleLogoUpload,
    logoPreview, setLogoPreview,
    handleSyncOfficialSignatory,
    clearSignature,
    sigPad,
    handleSignatureEnd,
    ttdPreview,
    handleStempelUpload,
    stempelPreview,
    handleRemoveStempel,
    isSaving,
    isUploading
}: PengaturanSuratProps) {
    const { register, watch } = useFormContext<PengaturanFormData>();

    return (
        <div className="p-6 md:p-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Column 1: Konfigurasi dan Validasi Tanda Tangan */}
                <div className="space-y-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                            <Text.H2 className="!font-bold">Konfigurasi Kop & Nomor</Text.H2>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Text.Label className="!text-gray-700 block">Teks Kop Surat (Enter Untuk Baris Baru)</Text.Label>
                                <button
                                    type="button"
                                    onClick={handleSyncOfficialKop}
                                    className="text-[10px] font-bold bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors flex items-center gap-1"
                                >
                                    ✓ Sinkron Data Resmi
                                </button>
                            </div>
                            <textarea
                                rows={4}
                                {...register('kop_surat')}
                                className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-center font-bold text-sm bg-gray-50 focus:bg-white transition-all"
                                placeholder="KONTEN KOP SURAT ANDA"
                            />
                        </div>
                        <div>
                            <Text.Label className="!text-gray-700 mb-2 block">Unggah Logo Kop (PNG/JPG)</Text.Label>
                            <div className="relative group mb-4">
                                <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-brand-50/30 group-hover:border-brand-300 transition-all cursor-pointer h-24 overflow-hidden">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={handleLogoUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {logoPreview ? (
                                        <div className="relative h-full flex items-center justify-center">
                                            <img src={logoPreview} alt="Logo Preview" className="h-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }}
                                                className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                            >
                                                <X weight="bold" className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-all">
                                                <Plus weight="bold" className="text-gray-400 w-4 h-4" />
                                            </div>
                                            <Text.Label className="!text-gray-500">Klik Untuk Upload Logo</Text.Label>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Text.Label className="!text-gray-700 mb-2 block">Format Nomor Surat</Text.Label>
                            <input
                                type="text"
                                {...register('format_nomor_surat')}
                                className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm bg-gray-50 focus:bg-white transition-all"
                                placeholder="[NOMOR]/[SCOPE]/[BULAN_ROMAWI]/[TAHUN]"
                            />
                            <Text.Caption className="!mt-2 !italic !px-1">Placeholder: [NOMOR], [SCOPE], [BULAN_ROMAWI], [TAHUN], [KODE_WILAYAH]</Text.Caption>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                        <div className="flex justify-between items-center border-b border-brand-100 pb-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                Validasi Tanda Tangan
                            </h3>
                            <button
                                type="button"
                                onClick={handleSyncOfficialSignatory}
                                className="text-[10px] font-bold bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors flex items-center gap-1"
                            >
                                ≡ Ambil Pengurus
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Text.Label className="!text-gray-700 mb-2 block">Nama Penandatangan RT</Text.Label>
                                <input type="text" {...register('penandatangan_nama')} placeholder="Contoh: Budi Santoso" className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm uppercase" />
                            </div>
                            <div>
                                <Text.Label className="!text-gray-700 mb-2 block">Jabatan Penandatangan RT</Text.Label>
                                <input type="text" {...register('penandatangan_jabatan')} placeholder="Contoh: Ketua RT. 01" className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm" />
                            </div>
                            <div>
                                <Text.Label className="!text-gray-700 mb-2 block">Nama Ketua RW (Mengetahui)</Text.Label>
                                <input type="text" {...register('nama_ketua_rw')} placeholder="Contoh: Drs. Sukirno, M.Pd." className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm uppercase" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Opsi QR, Signature, Stempel, Preview & Button */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between bg-brand-50/50 border border-brand-100 rounded-2xl p-4 shadow-sm">
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <QrCode weight="fill" className="w-5 h-5 text-brand-500" />
                                    Gunakan opsi QR Code
                                </h4>
                                <p className="text-[10px] text-gray-500 mt-1">Ganti tanda tangan basah dengan verifikasi QR Code.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register('ttd_pake_qr')} className="sr-only peer" />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-gray-700">Tanda Tangan Digital Touchscreen</label>
                                    <button
                                        type="button"
                                        onClick={clearSignature}
                                        className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider"
                                    >
                                        <Eraser weight="bold" /> Bersihkan
                                    </button>
                                </div>
                                <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden h-32 relative group shadow-sm ring-1 ring-gray-100">
                                    <SignatureCanvas
                                        ref={sigPad}
                                        penColor="black"
                                        onEnd={handleSignatureEnd}
                                        canvasProps={{
                                            className: 'signature-canvas w-full h-full cursor-crosshair',
                                        }}
                                    />
                                    {!ttdPreview && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 bg-gray-50/10">
                                            <Text.Label className="!text-gray-400 uppercase tracking-widest block">Goreskan Tanda Tangan</Text.Label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Logo Stempel RT</label>
                                <div className="relative group">
                                    <div className="border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-brand-50/30 group-hover:border-brand-300 transition-all cursor-pointer h-32 overflow-hidden shadow-sm">
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            onChange={handleStempelUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        {stempelPreview ? (
                                            <div className="relative h-full flex items-center justify-center">
                                                <img src={stempelPreview} alt="Stempel Preview" className="h-full object-contain mix-blend-multiply" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveStempel(); }}
                                                    className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                                >
                                                    <X weight="bold" className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center flex flex-col items-center gap-1">
                                                <Plus weight="bold" className="text-gray-400 w-5 h-5" />
                                                <Text.Label className="!text-gray-400 uppercase tracking-widest block">Unggah Stempel</Text.Label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Surat */}
                    <div className="bg-gray-100/50 p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-200 shadow-inner">
                        <div className="absolute top-4 right-4 z-30">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-[9px] font-bold text-brand-600 border border-brand-100 uppercase tracking-widest shadow-sm">
                                <div className="w-1 h-1 rounded-full bg-brand-600 animate-pulse"></div>
                                Live Preview
                            </span>
                        </div>

                        <div className="w-full max-w-[320px] aspect-[1/1.4] bg-white shadow-xl rounded-sm p-6 flex flex-col origin-center">
                            {/* Kop Preview */}
                            <div className="border-b-[1.5px] border-black pb-1 mb-3 text-center flex items-center gap-2">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                        <FileText className="text-gray-300 w-4 h-4" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    {watch('kop_surat')?.split('\n').map((line, i) => (
                                        <p key={i} className={`font-bold mt-0 leading-tight uppercase ${i === 0 ? 'text-[8px]' : 'text-[6px] text-gray-700'}`}>
                                            {line || (i === 0 ? 'KOP SURAT' : '')}
                                        </p>
                                    )) || <div className="h-4 bg-gray-50 rounded animate-pulse"></div>}
                                </div>
                            </div>

                            {/* Body Fake Text */}
                            <div className="space-y-3 flex-1 overflow-hidden">
                                <div className="space-y-1.5">
                                    <div className="h-1.5 w-full bg-gray-50 rounded"></div>
                                    <div className="h-1.5 w-[90%] bg-gray-50 rounded"></div>
                                    <div className="h-1.5 w-[95%] bg-gray-50 rounded"></div>
                                </div>
                                <div className="space-y-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-1.5">
                                            <div className="h-1.5 w-12 bg-gray-100 rounded"></div>
                                            <div className="h-1.5 w-0.5 bg-gray-200 rounded"></div>
                                            <div className="h-1.5 w-24 bg-gray-50 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Signature Preview */}
                            <div className="mt-6 flex justify-end">
                                <div className="text-center w-28 relative">
                                    <Text.Caption className="!text-[6px] !mb-1 !font-bold !leading-tight uppercase tracking-wider">Ketua {currentScope}</Text.Caption>

                                    <div className="h-12 flex items-center justify-center relative translate-y-[2px]">
                                        {watch('ttd_pake_qr') ? (
                                            <div className="bg-white p-1 rounded-sm border border-gray-100 shadow-sm relative z-20">
                                                <QRCodeCanvas
                                                    value={`${window.location.origin}/verify/sample-doc-id`}
                                                    size={36}
                                                    level="H"
                                                />
                                            </div>
                                        ) : ttdPreview ? (
                                            <img
                                                src={getFullUrl(ttdPreview)}
                                                alt="Signature"
                                                className="max-h-12 w-auto object-contain mix-blend-multiply brightness-90 contrast-125 relative z-20"
                                            />
                                        ) : (
                                            <div className="h-4 w-12 border-b border-dashed border-gray-200 relative z-20"></div>
                                        )}
                                        {!watch('ttd_pake_qr') && stempelPreview && (
                                            <img
                                                src={getFullUrl(stempelPreview)}
                                                alt="Stamp"
                                                className="absolute left-1/2 top-1/2 -translate-x-[80%] -translate-y-1/2 w-16 h-16 object-contain opacity-75 mix-blend-multiply pointer-events-none z-10"
                                            />
                                        )}
                                    </div>

                                    <Text.Caption className="!text-[7px] !font-bold !underline !mt-3 uppercase !leading-none">( {watch('penandatangan_nama') || 'RT NAME'} )</Text.Caption>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Button Simpan */}
                    <HasPermission module="Setup / Pengaturan" action="Ubah">
                        <button
                            type="submit"
                            disabled={isSaving || isUploading}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-brand-200 hover-lift active-press transition-all disabled:opacity-70 group"
                        >
                            <FloppyDisk weight="bold" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <Text.Label className="uppercase tracking-widest text-xs">{isSaving ? 'Menyimpan...' : isUploading ? 'Mengunggah...' : `Simpan Pengaturan ${currentScope}`}</Text.Label>
                        </button>
                    </HasPermission>
                </div>
            </div>
        </div>
    );
}
