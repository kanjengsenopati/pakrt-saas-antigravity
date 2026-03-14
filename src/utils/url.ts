const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Resolves a given path to a full URL.
 * If the path is already a full URL or a data URI, it returns it as is.
 * If it's a relative path (starting with /), it prefixes it with the server's base URL.
 * This helper ensures that both legacy local paths and new cloud-native (Cloudinary) URLs work correctly.
 */
export const getFullUrl = (path: string | undefined | null): string => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    // Fallback for relative paths (legacy)
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
