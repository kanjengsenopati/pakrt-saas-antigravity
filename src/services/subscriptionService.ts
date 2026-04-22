import api from './api';

export const subscriptionService = {
    async getStatus() {
        const res = await api.get('/subscription/status');
        return res.data;
    },

    async getPlans() {
        const res = await api.get('/subscription/plans');
        return res.data;
    },

    async createInvoice(data: { 
        pricePackageId?: string; 
        plan: string; 
        duration: number; 
        duration_unit: string; 
        base_amount: number 
    }) {
        const res = await api.post('/subscription/create-invoice', data);
        return res.data;
    },

    async uploadProof(invoiceId: string, proofUrl: string, method: string) {
        const res = await api.post('/subscription/upload-proof', {
            invoice_id: invoiceId,
            proof_url: proofUrl,
            method
        });
        return res.data;
    },

    async getInvoices() {
        const res = await api.get('/subscription/invoices');
        return res.data;
    }
};
