import api from './api';

export const pushService = {
    async subscribe(subscription: any) {
        return api.post('/push/subscribe', { subscription });
    },
    async unsubscribe(endpoint: string) {
        return api.post('/push/unsubscribe', { endpoint });
    }
};
