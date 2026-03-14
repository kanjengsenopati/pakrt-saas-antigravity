/**
 * Utility for hardened currency formatting (IDR)
 * Provides consistent thousand separators and currency symbol.
 */

/**
 * Formats a number into a Rupiah currency string (e.g., Rp 1.000)
 * Uses Intl.NumberFormat for persistent, region-aware formatting.
 */
export const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Formats a number to its string representation with thousand separators but without the "Rp" prefix.
 * Useful for input fields where the prefix is handled separately in the UI.
 */
export const formatNumberWithSeparators = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
    if (isNaN(num) || num === 0) return '';
    return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Parses a currency string back into a raw number.
 * Removes all non-digit characters.
 */
export const parseCurrencyToNumber = (value: string): number => {
    const rawValue = value.replace(/\D/g, '');
    return rawValue === '' ? 0 : parseInt(rawValue, 10);
};
