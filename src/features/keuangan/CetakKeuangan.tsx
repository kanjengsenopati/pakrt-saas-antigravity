import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { keuanganService } from '../../services/keuanganService';
import { pengaturanService } from '../../services/pengaturanService';
import { getFullUrl } from '../../utils/url';
import { formatRupiah } from '../../utils/currency';
import { Text } from '../../components/ui/Typography';
import { Printer, ArrowLeft, FilePdf, ShareNetwork } from '@phosphor-icons/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { ShareUtils } from '../../utils/shareUtils';

export default function CetakKeuangan() {
    const { month, year } = useParams<{ month: string, year: string }>();
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const printRef = useRef<HTMLDivElement>(null);

    const [transactions, setTransactions] = useState<any[]>([]);
    const [config, setConfig] = useState<any>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const monthNames = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ];

    useEffect(() => {
        const loadData = async () => {
            if (!currentTenant) return;
            setIsLoading(true);
            try {
                // Fetch all transactions to calculate Saldo Awal and Filter current month
                const data = await keuanganService.getAll(currentTenant.id, currentScope, 1, 5000);
                setTransactions(data.items || []);

                const settings = await pengaturanService.getAll(currentTenant.id, currentScope);
                const configRecord: any = {};
                settings.forEach(i => configRecord[i.key] = i.value);
                setConfig(configRecord);
            } catch (error) {
                console.error("Gagal memuat data keuangan:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentTenant, currentScope]);

    const reportData = useMemo(() => {
        if (!month || !year || transactions.length === 0) return { items: [], saldoAwal: 0, totalMasuk: 0, totalKeluar: 0, saldoAkhir: 0 };

        const targetMonth = parseInt(month) - 1;
        const targetYear = parseInt(year);

        const beforeDate = new Date(targetYear, targetMonth, 1);

        // Calculate Saldo Awal (All before target month)
        const saldoAwal = transactions
            .filter(t => new Date(t.tanggal) < beforeDate)
            .reduce((acc, curr) => {
                return curr.tipe === 'pemasukan' ? acc + curr.nominal : acc - curr.nominal;
            }, 0);

        // Filter items in target month
        const items = transactions
            .filter(t => {
                const d = new Date(t.tanggal);
                return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
            })
            .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

        const totalMasuk = items.filter(i => i.tipe === 'pemasukan').reduce((acc, curr) => acc + curr.nominal, 0);
        const totalKeluar = items.filter(i => i.tipe === 'pengeluaran').reduce((acc, curr) => acc + curr.nominal, 0);
        const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

        return { items, saldoAwal, totalMasuk, totalKeluar, saldoAkhir };
    }, [transactions, month, year]);

    const isIframe = () => {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    };

    const generatePDF = async () => {
        if (!printRef.current) return null;
        const element = printRef.current;
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        return pdf;
    };

    const downloadPDF = async () => {
        if (isIframe()) {
            toast.error("Fitur unduh diblokir pada mode preview. Silakan buka aplikasi di tab baru.");
            return;
        }
        setIsExporting(true);
        try {
            const pdf = await generatePDF();
            if (pdf) {
                pdf.save(`Laporan_Keuangan_${monthNames[parseInt(month!) - 1]}_${year}.pdf`);
            }
        } catch (error) {
            console.error("Gagal export PDF:", error);
            toast.error("Terjadi kesalahan saat mengekspor PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const sharePDF = async () => {
        setIsExporting(true);
        try {
            const pdf = await generatePDF();
            if (pdf) {
                const pdfBlob = pdf.output('blob');
                const fileName = `Laporan_Keuangan_${monthNames[parseInt(month!) - 1]}_${year}.pdf`;
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                await ShareUtils.shareOrDownloadFile(file, downloadPDF, 'Laporan Kas RT', `Berikut lampiran Laporan Keuangan untuk bulan ${monthNames[parseInt(month!) - 1]} ${year}.`);
            }
        } catch (error) {
            console.error("Gagal bagikan PDF:", error);
            toast.error("Terjadi kesalahan saat membagikan dokumen.");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center flex items-center justify-center min-h-screen"><Text.Body className="!text-slate-500">Memproses Laporan...</Text.Body></div>;

    const kopLines = config.kop_surat
        ? config.kop_surat.split('\n')
        : [`PENGURUS ${currentScope} ${currentTenant?.config?.rw ? `${currentTenant.config.rt ? `RT ${currentTenant.config.rt} / ` : ''}RW ${currentTenant.config.rw}` : currentTenant?.name || ''}`, `KOTA ${currentTenant?.config?.kota?.toUpperCase() || '....................'}`];

    return (
        <div className="bg-gray-100 min-h-screen py-8 print:py-0 print:bg-white">
            <div className="max-w-5xl mx-auto mb-6 px-4 print:hidden flex justify-between items-center gap-4">
                <button
                    onClick={() => navigate('/keuangan')}
                    className="flex items-center gap-2 pl-3 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft weight="bold" /> <Text.Label className="!text-slate-700">Kembali</Text.Label>
                </button>
                
                <div className="flex gap-3">
                    <button
                        onClick={sharePDF}
                        disabled={isExporting}
                        className="sm:hidden flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                        <ShareNetwork weight="bold" className="w-5 h-5" /> 
                        <Text.Label className="!text-white">{isExporting ? 'Proses...' : 'Bagikan WA'}</Text.Label>
                    </button>
                    <button
                        onClick={downloadPDF}
                        disabled={isExporting}
                        className="hidden sm:flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                        <FilePdf weight="bold" className="w-5 h-5" /> 
                        <Text.Label className="!text-white">{isExporting ? 'Proses...' : 'Unduh PDF'}</Text.Label>
                    </button>
                    <button
                        onClick={() => {
                            if (isIframe()) {
                                toast.error("Fitur cetak diblokir pada mode preview. Silakan buka aplikasi di tab baru.");
                                return;
                            }
                            window.print();
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <Printer weight="bold" className="w-5 h-5" /> <Text.Label className="!text-white">Cetak Laporan</Text.Label>
                    </button>
                </div>
            </div>

            <div ref={printRef} className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:w-full min-h-[29.7cm] p-[1.5cm] overflow-hidden text-black font-serif">
                
                {/* KOP SURAT */}
                <div className="flex items-center gap-4 border-b-[4px] border-double border-black pb-3 mb-6">
                    <img
                        src={getFullUrl(config.logo_kop) || "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Seal_of_the_City_of_Semarang.svg/1594px-Seal_of_the_City_of_Semarang.svg.png"}
                        alt="Logo"
                        className="w-20 h-20 object-contain"
                    />
                    <div className="flex-1 text-center pr-20">
                        {kopLines.map((line: string, i: number) => (
                            <h1 key={i} className={`font-bold uppercase leading-tight ${i === 0 ? 'text-[16pt]' : 'text-[12pt]'}`}>
                                {line}
                            </h1>
                        ))}
                    </div>
                </div>

                {/* TITLE */}
                <div className="text-center mb-8">
                    <h2 className="text-[14pt] font-bold underline uppercase">LAPORAN REKAPITULASI KEUANGAN</h2>
                    <p className="text-[12pt] font-bold uppercase mt-1">PERIODE {monthNames[parseInt(month!) - 1]} {year}</p>
                </div>

                {/* SUMMARY TABLE */}
                <div className="mb-6">
                    <table className="w-full border-collapse border border-black text-[10pt]">
                        <tbody>
                            <tr>
                                <td className="p-2 border border-black font-bold w-1/3">SALDO AWAL</td>
                                <td className="p-2 border border-black text-right font-bold">{formatRupiah(reportData.saldoAwal)}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-black">TOTAL PEMASUKAN</td>
                                <td className="p-2 border border-black text-right text-emerald-700">+ {formatRupiah(reportData.totalMasuk)}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-black">TOTAL PENGELUARAN</td>
                                <td className="p-2 border border-black text-right text-rose-700">- {formatRupiah(reportData.totalKeluar)}</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td className="p-2 border border-black font-bold">SALDO AKHIR</td>
                                <td className="p-2 border border-black text-right font-bold text-brand-700">{formatRupiah(reportData.saldoAkhir)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* DETAILS TABLE */}
                <div className="mb-8">
                    <h3 className="text-[10pt] font-bold mb-2 uppercase">RINCIAN TRANSAKSI :</h3>
                    <table className="w-full border-collapse border border-black text-[9pt]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 border border-black w-8 text-center">NO</th>
                                <th className="p-2 border border-black w-24 text-center">TANGGAL</th>
                                <th className="p-2 border border-black">KETERANGAN</th>
                                <th className="p-2 border border-black w-32 text-right">PEMASUKAN</th>
                                <th className="p-2 border border-black w-32 text-right">PENGELUARAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 border border-black text-center italic text-gray-400">Tidak ada transaksi pada periode ini.</td>
                                </tr>
                            ) : (
                                reportData.items.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td className="p-2 border border-black text-center">{idx + 1}</td>
                                        <td className="p-2 border border-black text-center">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</td>
                                        <td className="p-2 border border-black">
                                            <div className="font-bold uppercase text-[8pt]">{item.kategori}</div>
                                            <div className="text-gray-600 line-clamp-1">{item.keterangan.split('|')[0]}</div>
                                        </td>
                                        <td className="p-2 border border-black text-right">{item.tipe === 'pemasukan' ? formatRupiah(item.nominal) : '-'}</td>
                                        <td className="p-2 border border-black text-right">{item.tipe === 'pengeluaran' ? formatRupiah(item.nominal) : '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={3} className="p-2 border border-black text-right">JUMLAH</td>
                                <td className="p-2 border border-black text-right">{formatRupiah(reportData.totalMasuk)}</td>
                                <td className="p-2 border border-black text-right">{formatRupiah(reportData.totalKeluar)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* SIGNATURES */}
                <div className="mt-12 grid grid-cols-2 gap-20 text-[10pt] text-center">
                    <div>
                        <p className="mb-20">Menyetujui,<br /><span className="font-bold">Ketua {currentScope}</span></p>
                        <p className="font-bold underline uppercase">{config.nama_ketua_rt || config.penandatangan_nama || '..................................'}</p>
                    </div>
                    <div>
                        <p className="mb-20">Dicetak Pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br /><span className="font-bold">Bendahara</span></p>
                        <p className="font-bold underline uppercase">{config.nama_bendahara || '..................................'}</p>
                    </div>
                </div>

                <div className="mt-auto pt-10 text-center text-[7pt] text-gray-400 italic">
                    Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen PAKRT pada {new Date().toLocaleString('id-ID')}
                </div>

            </div>

            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
