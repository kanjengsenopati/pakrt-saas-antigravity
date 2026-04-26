/**
 * Utility for Iuran (Dues) calculations.
 * Pure functions for easy testing and consistent results across components.
 */

export interface IuranRate {
    kategori: string;
    nominal: number;
}

export const calculateTotalIuran = (
    selectedMonths: number[],
    rate: number,
    additionalFees: { label: string; amount: number }[] = []
): number => {
    const baseTotal = selectedMonths.length * rate;
    const extraTotal = additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
    return baseTotal + extraTotal;
};

export const getUnpaidMonths = (
    allMonths: number[],
    paidMonths: number[],
    pendingMonths: number[] = []
): number[] => {
    const occupied = new Set([...paidMonths, ...pendingMonths]);
    return allMonths.filter(m => !occupied.has(m));
};

export const formatPeriode = (months: number[], year: number): string => {
    if (months.length === 0) return '-';
    
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    if (months.length === 1) return `${monthNames[months[0] - 1]} ${year}`;
    
    // Sort months to handle ranges
    const sorted = [...months].sort((a, b) => a - b);
    
    // Check if it's a continuous range
    let isContinuous = true;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i-1] + 1) {
            isContinuous = false;
            break;
        }
    }
    
    if (isContinuous && sorted.length > 2) {
        return `${monthNames[sorted[0] - 1]} - ${monthNames[sorted[sorted.length - 1] - 1]} ${year}`;
    }
    
    return sorted.map(m => monthNames[m - 1].substring(0, 3)).join(', ') + ` ${year}`;
};
