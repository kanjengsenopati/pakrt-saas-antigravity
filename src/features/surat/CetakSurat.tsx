import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { getFullUrl } from '../../utils/url';
import { suratService, SuratWithWarga } from '../../services/suratService';
import { pengaturanService } from '../../services/pengaturanService';
import { Printer, ArrowLeft } from '@phosphor-icons/react';
import { QRCodeSVG } from 'qrcode.react';
import { dateUtils } from '../../utils/date';

export default function CetakSurat() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [surat, setSurat] = useState<SuratWithWarga | null>(null);
    const [config, setConfig] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!currentTenant || !id) return;
            setIsLoading(true);
            try {
                const suratData = await suratService.getById(id);
                if (suratData) setSurat(suratData);

                const settings = await pengaturanService.getAll(currentTenant.id, currentScope);
                setConfig(settings);
            } catch (error) {
                console.error("Gagal memuat data cetak:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, currentTenant, currentScope]);



    if (isLoading) return <div className="p-8 text-center text-gray-500 font-sans">Memuat dokumen...</div>;
    if (!surat || !surat.pemohon) return <div className="p-8 text-center text-red-500 font-sans">Dokumen tidak ditemukan atau data pemohon tidak lengkap.</div>;

    const kopLines = config.kop_surat
        ? config.kop_surat.split('\n')
        : [`PENGURUS ${currentScope} ${currentTenant?.config?.rw ? `${currentTenant.config.rt ? `RT ${currentTenant.config.rt} / ` : ''}RW ${currentTenant.config.rw}` : currentTenant?.name || ''}`, `KOTA ${currentTenant?.config?.kota?.toUpperCase() || '....................'}`];

    const getNomorSuratDisplay = () => {
        if (surat.nomor_surat) return surat.nomor_surat;

        let formatTemplate = config.format_nomor_surat || `[NOMOR]/[SCOPE]/[BULAN_ROMAWI]/[TAHUN]`;
        const dateObj = new Date(surat.tanggal);
        const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

        return formatTemplate
            .replace(/\[NOMOR\]/g, '___')
            .replace(/\[SCOPE\]/g, currentScope)
            .replace(/\[BULAN_ROMAWI\]/g, ROMAN[dateObj.getMonth() + 1])
            .replace(/\[TAHUN\]/g, dateObj.getFullYear().toString())
            .replace(/\[KODE_WILAYAH\]/g, currentTenant?.id || '');
    };

    return (
        <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white">
            <div className="max-w-4xl mx-auto mb-6 px-4 print:hidden flex justify-between items-center">
                <button
                    onClick={() => navigate('/surat')}
                    className="flex items-center gap-2 pl-3 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft weight="bold" /> Kembali
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                >
                    <Printer weight="bold" className="w-5 h-5" /> Cetak Surat
                </button>
            </div>

            {/* A4 Paper Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:w-full min-h-[29.7cm] p-[1cm] overflow-hidden">

                {/* KOP SURAT */}
                <div className="flex items-center gap-4 border-b-[4px] border-double border-black pb-3 mb-4">
                    <img
                        src={getFullUrl(config.logo_kop) || "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Seal_of_the_City_of_Semarang.svg/1594px-Seal_of_the_City_of_Semarang.svg.png"}
                        alt="Logo Instansi"
                        className="w-20 h-20 object-contain"
                    />
                    <div className="flex-1 text-center pr-20">
                        {kopLines.map((line: string, i: number) => (
                            <h1 key={i} className={`font-extrabold uppercase leading-none ${i === 0 ? 'text-[16pt]' :
                                i === 1 ? 'text-[14pt]' :
                                    'text-[12pt]'
                                }`}>
                                {line}
                            </h1>
                        ))}
                    </div>
                </div>

                {/* METADATA SECTION */}
                <div className="flex justify-between items-start mb-3 font-sans text-[10pt] leading-none">
                    <div className="space-y-0.5">
                        <div className="flex gap-4">
                            <span className="w-20">Nomor</span>
                            <span>: {getNomorSuratDisplay()}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="w-20">Lampiran</span>
                            <span>: -</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="w-20">Hal</span>
                            <span>: Surat Pengantar</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-right whitespace-nowrap">{currentTenant?.config?.kota || '....................'}, {dateUtils.toDisplay(surat.tanggal)}</p>
                        <div className="text-left leading-tight">
                            <p>Kepada Yth :</p>
                            <p className="font-bold">Kepala Kelurahan {currentTenant?.config?.kelurahan || '................'}</p>
                            <p>di <span className="underline uppercase">{currentTenant?.config?.kota || '....................'}</span></p>
                        </div>
                    </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="font-sans text-[10pt] space-y-1 leading-none">
                    <p className="ml-12 italic">Bersama ini menerangkan bahwa :</p>

                    <div className="ml-6">
                        <table className="w-full border-separate border-spacing-y-0 leading-none">
                            <tbody>
                                {[
                                    { n: '1.', l: 'Nama', v: surat.pemohon.nama },
                                    { n: '2.', l: 'Jenis Kelamin', v: (surat.pemohon as any).jenis_kelamin || 'Perempuan' },
                                    { n: '3.', l: 'Tempat / Tanggal Lahir', v: `${surat.pemohon.tempat_lahir || '-'}, ${dateUtils.toDisplay(surat.pemohon.tanggal_lahir)}` },
                                    { n: '4.', l: 'Kewarganegaraan / Agama', v: `WNI / ${(surat.pemohon as any).agama || 'Islam'}` },
                                    { n: '5.', l: 'Status', v: (surat.pemohon as any).status || 'Kawin' },
                                    { n: '6.', l: 'Pendidikan Terakhir', v: surat.pemohon.pendidikan || 'SMA / Sederajat' },
                                    { n: '7.', l: 'Pekerjaan', v: surat.pemohon.pekerjaan || '-' },
                                    { n: '8.', l: 'Alamat', v: surat.pemohon.alamat },
                                    { n: '9.', l: 'No. NIK', v: surat.pemohon.nik },
                                    { n: '10.', l: 'Keperluan', v: surat.keperluan },
                                    { n: '11.', l: 'Keterangan lain-lain', v: (surat as any).keterangan_lain || '-' }
                                ].map((row, idx) => (
                                    <tr key={idx} className="align-top">
                                        <td className="w-8 pr-2">{row.n}</td>
                                        <td className="w-56 pr-2">{row.l}</td>
                                        <td className="w-4">:</td>
                                        <td className="pl-2 font-medium">{row.v}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="ml-12">
                        Demikian untuk menjadikan periksa dan guna seperlunya.
                    </p>
                </div>

                {/* SIGNATURE SECTION */}
                <div className="mt-6 grid grid-cols-2 gap-20 font-sans text-[10pt] leading-none">
                    <div className="text-center">
                        <p className="mb-0.5">Mengetahui,</p>
                        <p className="font-bold mb-12">Ketua RW. {currentTenant?.config?.rw || '...'}</p>
                        <p className="font-bold underline uppercase">{config.nama_ketua_rw || '..................................'}</p>
                    </div>

                    <div className="text-center relative">
                        <p className="mb-0.5 opacity-0">Dikeluarkan di :</p>
                        <p className="font-bold mb-1">Ketua {currentScope} {currentTenant?.config?.rt && currentScope === 'RT' ? currentTenant.config.rt : ''} {currentTenant?.config?.rw ? `/ RW. ${currentTenant.config.rw}` : ''}</p>

                        <div className="h-24 flex items-center justify-center relative translate-y-[-5px]">
                            {config.ttd_pake_qr === 'true' || config.ttd_pake_qr === true ? (
                                <div className="bg-white p-1 rounded-md border border-gray-100 shadow-sm relative z-20">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/verify/${surat.id}`}
                                        size={60}
                                        level="H"
                                        includeMargin={false}
                                    />
                                    <p className="text-[5px] font-bold text-center mt-0.5 text-slate-400">SCAN TO VERIFY</p>
                                </div>
                            ) : config.ttd_image ? (
                                <img
                                    src={getFullUrl(config.ttd_image)}
                                    alt="Signature"
                                    className="max-h-24 w-auto object-contain mix-blend-multiply brightness-90 contrast-125 relative z-20"
                                />
                            ) : (
                                <div className="h-1 invisible relative z-20"></div>
                            )}
                            {!(config.ttd_pake_qr === 'true' || config.ttd_pake_qr === true) && config.ttd_stempel && (
                                <img
                                    src={getFullUrl(config.ttd_stempel)}
                                    alt="Stamp"
                                    className="absolute left-1/2 top-1/2 -translate-x-[80%] -translate-y-1/2 w-28 h-28 object-contain opacity-80 mix-blend-multiply pointer-events-none z-10"
                                />
                            )}
                        </div>
                        <p className="font-bold underline uppercase">{config.penandatangan_nama || '..................................'}</p>
                    </div>
                </div>

            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-m-0 { margin: 0 !important; }
                }
            `}</style>
        </div>
    );
}
