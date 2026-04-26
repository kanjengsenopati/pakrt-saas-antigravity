import { describe, it, expect } from 'vitest';
import { calculateTotalIuran, getUnpaidMonths, formatPeriode } from './iuranCalculator';

describe('IuranCalculator', () => {
    describe('calculateTotalIuran', () => {
        it('should calculate base total correctly', () => {
            expect(calculateTotalIuran([1, 2, 3], 50000)).toBe(150000);
        });

        it('should include additional fees', () => {
            const fees = [{ label: 'Sampah', amount: 5000 }];
            expect(calculateTotalIuran([1], 20000, fees)).toBe(25000);
        });

        it('should return 0 for no months and no fees', () => {
            expect(calculateTotalIuran([], 50000)).toBe(0);
        });
    });

    describe('getUnpaidMonths', () => {
        it('should return remaining months correctly', () => {
            const all = [1, 2, 3, 4, 5];
            const paid = [1, 2];
            const pending = [3];
            expect(getUnpaidMonths(all, paid, pending)).toEqual([4, 5]);
        });
    });

    describe('formatPeriode', () => {
        it('should format single month correctly', () => {
            expect(formatPeriode([1], 2024)).toBe('Januari 2024');
        });

        it('should format continuous range correctly', () => {
            expect(formatPeriode([1, 2, 3], 2024)).toBe('Januari - Maret 2024');
        });

        it('should format non-continuous months with abbreviations', () => {
            expect(formatPeriode([1, 3, 5], 2024)).toBe('Jan, Mar, Mei 2024');
        });
    });
});
