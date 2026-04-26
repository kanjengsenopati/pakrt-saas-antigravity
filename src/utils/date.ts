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
 * Simple formatter for custom date strings.
 * @param dateInput 
 * @param formatStr e.g. 'dd MMM YYYY', 'HH:mm'
 */
export const dateStoreFormat = (dateInput: string | Date | null | undefined, formatStr: string): string => {
    if (!dateInput) return '-';
    // Handle YYYY-MM-DD that might be interpreted as UTC by new Date()
    // causing off-by-one day issues
    let d: Date;
    if (typeof dateInput === 'string' && dateInput.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        d = new Date(year, month - 1, day);
    } else {
        d = new Date(dateInput);
    }

    if (isNaN(d.getTime())) return '-';

    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthsFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    return formatStr
        .replace('dd', String(day).padStart(2, '0'))
        .replace('MM', String(month + 1).padStart(2, '0'))
        .replace('MMM', months[month])
        .replace('MMMM', monthsFull[month])
        .replace('YYYY', String(year))
        .replace('HH', String(hours).padStart(2, '0'))
        .replace('mm', String(minutes).padStart(2, '0'));
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
    format: dateStoreFormat,
};
