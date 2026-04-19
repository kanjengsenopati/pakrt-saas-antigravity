import api from './api';

export const superAdminService = {
    // ── TENANTS ──
    async getTenants(page = 1, limit = 20, search?: string, status?: string, kecamatan?: string, kelurahan?: string, rw?: string) {
        const params: any = { page, limit };
        if (search) params.search = search;
        if (status) params.status = status;
        if (kecamatan) params.kecamatan = kecamatan;
        if (kelurahan) params.kelurahan = kelurahan;
        if (rw) params.rw = rw;
        const res = await api.get('/super-admin/tenants', { params });
        return res.data;
    },

    async getTenantRegionStats() {
        const res = await api.get('/super-admin/tenants-stats');
        return res.data;
    },

    async getTenantDetail(id: string) {
        const res = await api.get(`/super-admin/tenants/${id}`);
        return res.data;
    },

    async updateSubscription(id: string, data: { plan: string; status: string; until: string }) {
        const res = await api.put(`/super-admin/tenants/${id}/subscription`, data);
        return res.data;
    },

    async suspendTenant(id: string, reason: string) {
        const res = await api.post(`/super-admin/tenants/${id}/suspend`, { reason });
        return res.data;
    },

    async unsuspendTenant(id: string) {
        const res = await api.post(`/super-admin/tenants/${id}/unsuspend`);
        return res.data;
    },

    // ── INVOICES ──
    async getInvoices(page = 1, limit = 20, status?: string) {
        const params: any = { page, limit };
        if (status) params.status = status;
        const res = await api.get('/super-admin/invoices', { params });
        return res.data;
    },

    async createInvoice(data: { tenant_id: string; plan: string; duration_months: number; base_amount: number }) {
        const res = await api.post('/super-admin/invoices', data);
        return res.data;
    },

    async uploadPaymentProof(invoiceId: string, proofUrl: string, method: string) {
        const res = await api.post(`/super-admin/invoices/${invoiceId}/upload-proof`, {
            proof_url: proofUrl,
            method
        });
        return res.data;
    },

    async verifyInvoice(invoiceId: string, action: 'VERIFY' | 'REJECT', reason?: string) {
        const res = await api.post(`/super-admin/invoices/${invoiceId}/verify`, { action, reason });
        return res.data;
    },

    // ── ANALYTICS ──
    async getOverview() {
        const res = await api.get('/super-admin/analytics/overview');
        return res.data;
    },

    async getGrowth() {
        const res = await api.get('/super-admin/analytics/growth');
        return res.data;
    },

    async getRevenue(startDate?: string, endDate?: string) {
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        const res = await api.get('/super-admin/analytics/revenue', { params });
        return res.data;
    },

    // ── AFFILIATES ──
    async getAffiliates() {
        const res = await api.get('/super-admin/affiliates');
        return res.data;
    }
};
