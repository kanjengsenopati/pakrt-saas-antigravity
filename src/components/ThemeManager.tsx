import { useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { pengaturanService } from '../services/pengaturanService';

export function ThemeManager() {
    const { currentTenant, currentScope } = useTenant();

    useEffect(() => {
        // Apply scope to body data-attribute for CSS selection
        document.body.setAttribute('data-scope', currentScope);

        // Fetch and apply custom theme color
        if (currentTenant) {
            pengaturanService.getByKey(currentTenant.id, currentScope, 'warna_tema').then(config => {
                if (config && typeof config.value === 'string' && config.value.startsWith('#')) {
                    applyThemeColor(config.value);
                }
            });
        }
    }, [currentTenant, currentScope]);

    const applyThemeColor = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) {
            const root = document.documentElement;
            // Primary 500
            root.style.setProperty('--color-brand-500', `${rgb.r} ${rgb.g} ${rgb.b}`);

            // Light shades (50, 100) - making them very pale
            const r50 = Math.min(255, rgb.r + (255 - rgb.r) * 0.9);
            const g50 = Math.min(255, rgb.g + (255 - rgb.g) * 0.9);
            const b50 = Math.min(255, rgb.b + (255 - rgb.b) * 0.9);
            root.style.setProperty('--color-brand-50', `${Math.round(r50)} ${Math.round(g50)} ${Math.round(b50)}`);

            const r100 = Math.min(255, rgb.r + (255 - rgb.r) * 0.8);
            const g100 = Math.min(255, rgb.g + (255 - rgb.g) * 0.8);
            const b100 = Math.min(255, rgb.b + (255 - rgb.b) * 0.8);
            root.style.setProperty('--color-brand-100', `${Math.round(r100)} ${Math.round(g100)} ${Math.round(b100)}`);

            // Darker shade (600)
            const r600 = Math.max(0, rgb.r * 0.9);
            const g600 = Math.max(0, rgb.g * 0.9);
            const b600 = Math.max(0, rgb.b * 0.9);
            root.style.setProperty('--color-brand-600', `${Math.round(r600)} ${Math.round(g600)} ${Math.round(b600)}`);

            // Background glow
            root.style.setProperty('--bg-glow-1', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
        }
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    return null;
}
