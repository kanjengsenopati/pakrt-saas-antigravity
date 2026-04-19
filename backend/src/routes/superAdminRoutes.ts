import { FastifyInstance } from 'fastify';
import { superAdminService } from '../services/superAdminService';
import { requireSuperAdmin } from '../middleware/superAdminGuard';
import { authenticate } from '../middleware/auth';

export default async function superAdminRoutes(fastify: FastifyInstance) {
  // All routes require authentication + super admin role
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireSuperAdmin);

  // ── TENANT MANAGEMENT ──────────────────────────────

  fastify.get('/tenants', async (request) => {
    const { page, limit, search, status } = request.query as any;
    return await superAdminService.getAllTenants(
      Number(page) || 1,
      Number(limit) || 20,
      search,
      status
    );
  });

  fastify.get('/tenants/:id', async (request) => {
    const { id } = request.params as any;
    const detail = await superAdminService.getTenantDetail(id);
    if (!detail) return { error: 'Tenant tidak ditemukan' };
    return detail;
  });

  fastify.put('/tenants/:id/subscription', async (request) => {
    const { id } = request.params as any;
    const data = request.body as any;
    return await superAdminService.updateSubscription(id, data);
  });

  fastify.post('/tenants/:id/suspend', async (request) => {
    const { id } = request.params as any;
    const { reason } = request.body as any;
    return await superAdminService.suspendTenant(id, reason || 'Suspended by Super Admin');
  });

  fastify.post('/tenants/:id/unsuspend', async (request) => {
    const { id } = request.params as any;
    return await superAdminService.unsuspendTenant(id);
  });

  // ── INVOICE / PAYMENT MANAGEMENT ───────────────────

  fastify.get('/invoices', async (request) => {
    const { page, limit, status } = request.query as any;
    return await superAdminService.getAllInvoices(
      Number(page) || 1,
      Number(limit) || 20,
      status
    );
  });

  fastify.post('/invoices', async (request) => {
    const { tenant_id, plan, duration_months, base_amount } = request.body as any;
    return await superAdminService.createInvoice(tenant_id, {
      plan,
      duration_months: Number(duration_months),
      base_amount: Number(base_amount)
    });
  });

  fastify.post('/invoices/:id/upload-proof', async (request) => {
    const { id } = request.params as any;
    const { proof_url, method } = request.body as any;
    return await superAdminService.uploadPaymentProof(id, proof_url, method);
  });

  fastify.post('/invoices/:id/verify', async (request) => {
    const { id } = request.params as any;
    const { action, reason } = request.body as any;
    const user = (request as any).user;
    return await superAdminService.verifyInvoice(id, user.id, action, reason);
  });

  // ── ANALYTICS ──────────────────────────────────────

  fastify.get('/analytics/overview', async () => {
    return await superAdminService.getPlatformOverview();
  });

  fastify.get('/analytics/growth', async () => {
    return await superAdminService.getTenantGrowth();
  });

  fastify.get('/analytics/revenue', async (request) => {
    const { start_date, end_date } = request.query as any;
    return await superAdminService.getRevenueReport(start_date, end_date);
  });

  // ── AFFILIATE ──────────────────────────────────────

  fastify.get('/affiliates', async () => {
    return await superAdminService.getAffiliateReport();
  });
}
