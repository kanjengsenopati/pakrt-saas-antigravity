import { FastifyInstance } from 'fastify';
import { superAdminService } from '../services/superAdminService';
import { prisma } from '../prisma';

/**
 * Tenant-side subscription routes.
 * These are protected routes (user must be authenticated).
 * All operations are scoped to the user's own tenant.
 */
export default async function subscriptionRoutes(fastify: FastifyInstance) {

  // Get current subscription status for tenant
  fastify.get('/status', async (request) => {
    const user = (request as any).user;
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenant_id },
      select: {
        id: true,
        name: true,
        subscription_status: true,
        subscription_plan: true,
        subscription_until: true,
        referral_code: true
      }
    });
    return tenant;
  });

  // Get pricing plans (static for now, but can be DB-driven later)
  fastify.get('/plans', async () => {
    return {
      plans: [
        {
          id: 'PREMIUM_1',
          name: 'Premium Bulanan',
          plan: 'PREMIUM',
          duration_months: 1,
          base_amount: 49000,
          description: 'Akses semua fitur premium selama 1 bulan'
        },
        {
          id: 'PREMIUM_3',
          name: 'Premium 3 Bulan',
          plan: 'PREMIUM',
          duration_months: 3,
          base_amount: 129000,
          description: 'Hemat 12% — akses 3 bulan penuh',
          badge: 'Hemat 12%'
        },
        {
          id: 'PREMIUM_6',
          name: 'Premium 6 Bulan',
          plan: 'PREMIUM',
          duration_months: 6,
          base_amount: 239000,
          description: 'Hemat 19% — akses 6 bulan penuh',
          badge: 'Populer'
        },
        {
          id: 'PREMIUM_12',
          name: 'Premium Tahunan',
          plan: 'PREMIUM',
          duration_months: 12,
          base_amount: 449000,
          description: 'Hemat 24% — akses sepanjang tahun',
          badge: 'Best Value'
        }
      ],
      bank_accounts: [
        { bank: 'BCA', account: '1234567890', name: 'PT Semesta Tekno Partner' },
        { bank: 'BRI', account: '0987654321', name: 'PT Semesta Tekno Partner' },
        { bank: 'Mandiri', account: '1122334455', name: 'PT Semesta Tekno Partner' }
      ]
    };
  });

  // Create a new invoice (tenant initiates subscription)
  fastify.post('/create-invoice', async (request) => {
    const user = (request as any).user;
    const { plan, duration_months, base_amount } = request.body as any;

    return await superAdminService.createInvoice(user.tenant_id, {
      plan,
      duration_months: Number(duration_months),
      base_amount: Number(base_amount)
    });
  });

  // Upload payment proof
  fastify.post('/upload-proof', async (request) => {
    const user = (request as any).user;
    const { invoice_id, proof_url, method } = request.body as any;

    // Verify the invoice belongs to this tenant
    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id: invoice_id }
    });
    if (!invoice || invoice.tenant_id !== user.tenant_id) {
      return { error: 'Invoice tidak ditemukan' };
    }

    return await superAdminService.uploadPaymentProof(invoice_id, proof_url, method);
  });

  // Get invoice history for this tenant
  fastify.get('/invoices', async (request) => {
    const user = (request as any).user;
    const invoices = await prisma.subscriptionInvoice.findMany({
      where: { tenant_id: user.tenant_id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return invoices;
  });
}
