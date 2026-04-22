import { prisma } from '../prisma';
import { DocumentUtils } from '../utils/DocumentUtils';

/**
 * Super Admin Service — Platform-wide operations across all tenants.
 */
export const superAdminService = {

  // ──────────────────────────────────────────────────────
  // TENANT MANAGEMENT
  // ──────────────────────────────────────────────────────

  async getAllTenants(page: number = 1, limit: number = 20, search?: string, status?: string, kecamatan?: string, kelurahan?: string, rwSearch?: string) {
    const where: any = {
      id: { not: 'SYSTEM' } // Exclude internal system tenant
    };
    if (status) where.subscription_status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Add location filtering
    let idPrefix = '';
    
    if (kelurahan) {
       const kel = await prisma.wilayah.findFirst({
           where: { name: { equals: kelurahan, mode: 'insensitive' }, level: 'keldesa' }
       });
       if (kel) {
           idPrefix = kel.id + '.';
       }
    } else if (kecamatan) {
       const kec = await prisma.wilayah.findFirst({
           where: { name: { equals: kecamatan, mode: 'insensitive' }, level: 'kecamatan' }
       });
       if (kec) {
           idPrefix = kec.id + '.';
       }
    }
    
    if (idPrefix || rwSearch) {
       if (idPrefix && rwSearch) {
           where.id = { startsWith: idPrefix + rwSearch + '.' };
       } else if (idPrefix) {
           where.id = { startsWith: idPrefix };
       } else if (rwSearch) {
           where.id = { contains: '.' + rwSearch + '.' };
       }
    }

    const skip = (page - 1) * limit;
    const [rawItems, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true, wargas: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.tenant.count({ where })
    ]);

    // Enrich items with location metadata
    const items = await Promise.all(rawItems.map(async (t) => {
      const parts = t.id.split('.');
      if (parts.length < 6) return { ...t, kecamatan: null, kelurahan: null, rw: null, rt: null };

      const kecCode = parts.slice(0, 3).join('.');
      const kelCode = parts.slice(0, 4).join('.');
      const rw = parts[4];
      const rt = parts[5];

      const [kecObj, kelObj] = await Promise.all([
        prisma.wilayah.findUnique({ where: { id: kecCode } }),
        prisma.wilayah.findUnique({ where: { id: kelCode } })
      ]);

      return {
        ...t,
        kecamatan: kecObj ? kecObj.name : null,
        kelurahan: kelObj ? kelObj.name : null,
        kota: 'Kota Semarang',
        rw,
        rt
      };
    }));

    return { items, total, page, limit };
  },

  async getTenantDetail(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { users: true, wargas: true, invoices: true, roles: true }
        }
      }
    });
    if (!tenant) return null;

    // Fetch admin user for this tenant
    const adminUser = await prisma.user.findFirst({
      where: { tenant_id: tenantId, role: 'admin' },
      select: { id: true, name: true, email: true, kontak: true }
    });

    // Module usage stats
    const [agendaCount, iuranCount, keuanganCount, suratCount] = await Promise.all([
      prisma.agenda.count({ where: { tenant_id: tenantId } }),
      prisma.pembayaranIuran.count({ where: { tenant_id: tenantId } }),
      prisma.keuangan.count({ where: { tenant_id: tenantId } }),
      prisma.suratPengantar.count({ where: { tenant_id: tenantId } })
    ]);

    // Parse location from ID
    let kecamatan = null;
    let kelurahan = null;
    let rw = null;
    let rt = null;

    const parts = tenantId.split('.');
    if (parts.length >= 6) {
      const kecCode = parts.slice(0, 3).join('.');
      const kelCode = parts.slice(0, 4).join('.');
      rw = parts[4];
      rt = parts[5];

      const [kecObj, kelObj] = await Promise.all([
        prisma.wilayah.findUnique({ where: { id: kecCode } }),
        prisma.wilayah.findUnique({ where: { id: kelCode } })
      ]);
      kecamatan = kecObj ? kecObj.name : null;
      kelurahan = kelObj ? kelObj.name : null;
    }

    return {
      ...tenant,
      kecamatan,
      kelurahan,
      kota: 'Kota Semarang',
      rw,
      rt,
      admin: adminUser,
      module_stats: { agendaCount, iuranCount, keuanganCount, suratCount }
    };
  },

  async updateSubscription(tenantId: string, data: {
    plan: string;
    status: string;
    until: string; // ISO date string
  }) {
    return await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscription_plan: data.plan,
        subscription_status: data.status,
        subscription_until: new Date(data.until)
      }
    });
  },

  async suspendTenant(tenantId: string, reason: string) {
    return await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscription_status: 'SUSPENDED',
        suspended_reason: reason
      }
    });
  },

  async unsuspendTenant(tenantId: string) {
    return await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscription_status: 'ACTIVE',
        suspended_reason: null
      }
    });
  },

  // ──────────────────────────────────────────────────────
  // INVOICE / PAYMENT (Manual Transfer Flow)
  // ──────────────────────────────────────────────────────

    let duration = data.duration || 1;
    let duration_unit = data.duration_unit || 'MONTH';
    let base_amount = data.base_amount || 0;

    // If pricePackageId is provided, fetch details from DB
    if (data.pricePackageId) {
      const pkg = await prisma.pricePackage.findUnique({
        where: { id: data.pricePackageId }
      });
      if (!pkg) throw new Error('Paket harga tidak ditemukan');
      plan = 'PREMIUM'; // Currently all packages are premium
      duration = pkg.duration;
      duration_unit = pkg.duration_unit;
      base_amount = pkg.price;
    }

    // Generate 3-digit unique code (100-999)
    const uniqueCode = Math.floor(Math.random() * 900) + 100;
    const totalAmount = base_amount + uniqueCode;

    // Generate invoice number: INV-YYYY-MM-{serial}
    const now = new Date();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const yearStr = String(now.getFullYear());

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const count = await prisma.subscriptionInvoice.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd }
      }
    });

    const serial = String(count + 1).padStart(3, '0');
    const invoiceNumber = `INV-${yearStr}-${monthStr}-${serial}`;

    // Invoice expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return await prisma.subscriptionInvoice.create({
      data: {
        tenant_id: tenantId,
        invoice_number: invoiceNumber,
        unique_code: uniqueCode,
        plan: plan,
        pricePackageId: data.pricePackageId,
        duration: duration,
        duration_unit: duration_unit,
        base_amount: base_amount,
        total_amount: totalAmount,
        expiresAt
      }
    });
  },


  async uploadPaymentProof(invoiceId: string, proofUrl: string, method: string) {
    return await prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: {
        payment_proof: proofUrl,
        payment_method: method,
        status: 'UPLOADED'
      }
    });
  },

  async verifyInvoice(invoiceId: string, verifiedBy: string, action: 'VERIFY' | 'REJECT', reason?: string) {
    const invoice = await prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId }
    });
    if (!invoice) throw new Error('Invoice tidak ditemukan');

    if (action === 'VERIFY') {
      // Activate subscription
      const untilDate = new Date();
      if (invoice.duration_unit === 'WEEK') {
        untilDate.setDate(untilDate.getDate() + (invoice.duration * 7));
      } else {
        untilDate.setMonth(untilDate.getMonth() + invoice.duration);
      }

      await prisma.tenant.update({
        where: { id: invoice.tenant_id },
        data: {
          subscription_status: 'ACTIVE',
          subscription_plan: invoice.plan,
          subscription_until: untilDate
        }
      });

      return await prisma.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'VERIFIED',
          verified_by: verifiedBy,
          verified_at: new Date()
        }
      });
    } else {
      return await prisma.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'REJECTED',
          verified_by: verifiedBy,
          verified_at: new Date(),
          rejected_reason: reason || 'Bukti pembayaran tidak valid'
        }
      });
    }
  },

  async getAllInvoices(page: number = 1, limit: number = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.subscriptionInvoice.findMany({
        where,
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.subscriptionInvoice.count({ where })
    ]);

    return { items, total, page, limit };
  },

  // ──────────────────────────────────────────────────────
  // ANALYTICS
  // ──────────────────────────────────────────────────────

  async getPlatformOverview() {
    const [
      totalTenants,
      totalUsers,
      totalWarga,
      activeSubs,
      trialSubs,
      expiredSubs,
      premiumSubs,
      pendingInvoices
    ] = await Promise.all([
      prisma.tenant.count({ where: { id: { not: 'SYSTEM' } } }),
      prisma.user.count({ where: { tenant_id: { not: 'SYSTEM' } } }),
      prisma.warga.count(),
      prisma.tenant.count({ where: { subscription_status: 'ACTIVE', id: { not: 'SYSTEM' } } }),
      prisma.tenant.count({ where: { subscription_status: 'TRIAL', id: { not: 'SYSTEM' } } }),
      prisma.tenant.count({ where: { subscription_status: 'EXPIRED', id: { not: 'SYSTEM' } } }),
      prisma.tenant.count({ where: { subscription_plan: 'PREMIUM', id: { not: 'SYSTEM' } } }),
      prisma.subscriptionInvoice.count({ where: { status: 'UPLOADED' } }) // Waiting for verification
    ]);

    return {
      totalTenants,
      totalUsers,
      totalWarga,
      subscriptions: {
        active: activeSubs,
        trial: trialSubs,
        expired: expiredSubs,
        premium: premiumSubs
      },
      pendingInvoices
    };
  },

  async getTenantGrowth() {
    // Get tenant registration counts grouped by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const tenants = await prisma.tenant.findMany({
      where: {
        id: { not: 'SYSTEM' },
        createdAt: { gte: twelveMonthsAgo }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month
    const monthlyGrowth: Record<string, number> = {};
    tenants.forEach(t => {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyGrowth[key] = (monthlyGrowth[key] || 0) + 1;
    });

    return Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count }));
  },

  async getRevenueReport(startDate?: string, endDate?: string) {
    const where: any = { status: 'VERIFIED' };
    if (startDate) where.verified_at = { gte: new Date(startDate) };
    if (endDate) {
      where.verified_at = { ...where.verified_at, lte: new Date(endDate) };
    }

    const invoices = await prisma.subscriptionInvoice.findMany({
      where,
      select: {
        total_amount: true,
        verified_at: true,
        plan: true,
        duration: true,
        duration_unit: true
      },
      orderBy: { verified_at: 'asc' }
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    invoices.forEach(inv => {
      if (inv.verified_at) {
        const key = `${inv.verified_at.getFullYear()}-${String(inv.verified_at.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + inv.total_amount;
      }
    });

    return {
      totalRevenue,
      invoiceCount: invoices.length,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }))
    };
  },

  // ──────────────────────────────────────────────────────
  // AFFILIATE
  // ──────────────────────────────────────────────────────

  async getAffiliateReport() {
    const rewards = await prisma.affiliateReward.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Get top referrers
    const referrerCounts: Record<string, number> = {};
    rewards.forEach(r => {
      referrerCounts[r.referrer_tenant] = (referrerCounts[r.referrer_tenant] || 0) + 1;
    });

    const topReferrers = Object.entries(referrerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tenantId, count]) => ({ tenantId, count }));

    // Enrich with tenant names
    const tenantIds = topReferrers.map(r => r.tenantId);
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true }
    });
    const tenantMap = new Map(tenants.map(t => [t.id, t.name]));

    return {
      totalRewards: rewards.length,
      pendingRewards: rewards.filter(r => r.status === 'PENDING').length,
      claimedRewards: rewards.filter(r => r.status === 'CLAIMED').length,
      topReferrers: topReferrers.map(r => ({
        ...r,
        tenantName: tenantMap.get(r.tenantId) || r.tenantId
      })),
      recentRewards: rewards.slice(0, 20)
    };
  }
};
