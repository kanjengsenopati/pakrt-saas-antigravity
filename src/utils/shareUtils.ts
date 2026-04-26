import { toast } from 'sonner';

export const ShareUtils = {
    /**
     * Checks if the device/browser supports sharing files via Web Share API Level 2.
     */
    canShareFile(file: File): boolean {
        return !!navigator.canShare && navigator.canShare({ files: [file] });
    },

    /**
     * Shares a file via Web Share API if supported, otherwise triggers a download fallback.
     */
    async shareOrDownloadFile(file: File, fallbackDownloadFn?: () => void, shareTitle: string = 'Bagikan Dokumen', shareText: string = 'Berikut dokumen terlampir.') {
        if (this.canShareFile(file)) {
            try {
                await navigator.share({
                    files: [file],
                    title: shareTitle,
                    text: shareText,
                });
                toast.success('Dokumen berhasil dibagikan.');
            } catch (error: any) {
                // User might have cancelled the share, which throws an AbortError.
                if (error.name !== 'AbortError') {
                    console.error('Error sharing file:', error);
                    toast.error('Gagal membagikan dokumen.');
                }
            }
        } else {
            // Fallback to Download
            toast.info('Perangkat Anda tidak mendukung fitur berbagi file langsung. File akan diunduh.');
            if (fallbackDownloadFn) {
                fallbackDownloadFn();
            } else {
                this.downloadFile(file);
            }
        }
    },

    /**
     * Standard local file download trigger.
     */
    downloadFile(file: File) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
