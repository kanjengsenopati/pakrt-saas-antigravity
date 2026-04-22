/**
 * Utility for handling file operations in the browser.
 */
export const fileUtils = {
    /**
     * Triggers a browser download for a given Blob.
     * 
     * @param data The Blob or data to download
     * @param fileName The name of the file
     * @param mimeType Optional mime type (defaults to application/octet-stream if not provided by Blob)
     */
    downloadFile(data: BlobPart, fileName: string, mimeType?: string): void {
        try {
            const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            
            link.click();
            
            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[FileUtils] Failed to download file:', error);
            throw new Error('Gagal mengunduh file. Silakan coba lagi.');
        }
    }
};
