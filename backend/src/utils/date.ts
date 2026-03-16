export const dateUtils = {
    /**
     * Normalize various date formats to YYYY-MM-DD
     * @param dateStr 
     * @returns YYYY-MM-DD string or null if invalid
     */
    normalize: (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        
        // If it's already YYYY-MM-DD (e.g. 1990-05-15)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }

        // If it's DD-MM-YYYY (e.g. 15-05-1990 or 15/05/1990)
        const dmyMatch = dateStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
        if (dmyMatch) {
            return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
        }

        // Try parsing with native Date
        try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                // Avoid returning "NaN" or other weirdness
                if (year > 1000) {
                   return `${year}-${month}-${day}`;
                }
            }
        } catch (e) {
            // ignore
        }

        return dateStr; // Fallback to original if can't normalize
    }
};
