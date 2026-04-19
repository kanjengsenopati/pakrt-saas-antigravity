export const parseApiError = (error: any, defaultMessage: string = 'Terjadi kesalahan sistem.'): string => {
    if (!error) return defaultMessage;
    
    // Check if error is an Axios error with response data
    if (error.response?.data?.error) {
        const errData = error.response.data.error;
        if (typeof errData === 'string') {
            return errData;
        }
        if (typeof errData === 'object' && errData !== null) {
            return errData.message || errData.code || defaultMessage;
        }
    }
    
    // Standard error message
    if (error.message) {
        return error.message;
    }
    
    return defaultMessage;
};
