import React, { InputHTMLAttributes } from 'react';
import { formatNumberWithSeparators, parseCurrencyToNumber } from '../../utils/currency';

export interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: number | string;
    onChange?: (value: number) => void;
    error?: boolean;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onChange, error, className = '', ...props }, ref) => {
        // Handle persistent formatting with thousand separators
        const displayValue = value === undefined || value === null || (typeof value === 'number' && isNaN(value))
            ? ''
            : formatNumberWithSeparators(value);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const parsedValue = parseCurrencyToNumber(e.target.value);
            if (onChange) {
                onChange(parsedValue);
            }
        };

        return (
            <input
                {...props}
                ref={ref}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full rounded-lg shadow-sm border outline-none transition-colors 
                    ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 bg-gray-50 focus:bg-white'} 
                    ${className.includes('p-') ? className : `p-3 ${className}`}
                `}
            />
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';
