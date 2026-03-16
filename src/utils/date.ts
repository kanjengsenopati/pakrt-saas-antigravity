/**
 * Utility for standardized date formatting across the application.
 * Baseline display format: DD-MM-YYYY
 * Storage format: YYYY-MM-DD
 */

/**
 * Formats a date string (ISO or YYYY-MM-DD) into DD-MM-YYYY for display.
 * @param dateInput - String or Date object
 * @returns Formatted date string or '-' if invalid/empty
 */
export const formatDateDisplay = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '-';
    
    let d: Date;
    if (dateInput instanceof Date) {
        d = dateInput;
    } else {
        // If it's already DD-MM-YYYY, return as is (but ensure it's not YYYY-MM-DD)
        if (typeof dateInput === 'string' && dateInput.includes('-')) {
            const parts = dateInput.split('-');
            if (parts[0].length === 2 && parts[1]?.length === 2 && parts[2]?.length === 4) {
                return dateInput;
            }
        }
        d = new Date(dateInput);
    }

    if (isNaN(d.getTime())) {
        // Fallback for strings that are not valid dates but might be partials
        if (typeof dateInput === 'string') return dateInput;
        return '-';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
};

/**
 * Normalizes a date string for HTML5 date input (YYYY-MM-DD).
 * Browser <input type="date"> requires this specific format.
 */
export const normalizeDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    // If it's DD-MM-YYYY, convert to YYYY-MM-DD
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 2 && parts[2]?.length === 4) {
             return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    
    return dateStr;
};

/**
 * Convert Date object or YYYY-MM-DD string to various formats.
 */
export const dateUtils = {
    toDisplay: formatDateDisplay,
    toInput: normalizeDateForInput,
};
