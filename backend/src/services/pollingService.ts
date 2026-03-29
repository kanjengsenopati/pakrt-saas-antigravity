import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';

export const pollingService = {
  async getAll(tenantId: string, scope?: string, status: string = 'Aktif') {
    const where: any = { tenant_id: tenantId };
    if (status) where.status = status;
    if (scope) where.scope = scope;

    return await prisma.polling.findMany({
      where,
      include: {
        opsi: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        aduan_usulan: true
      },
      orderBy: { tanggal_mulai: 'desc' }
    });
  },

  async createFromUsulan(aduanUsulanId: string, data: any) {
    const usulan = await prisma.aduanUsulan.findUnique({
      where: { id: aduanUsulanId }
    });

    if (!usulan || usulan.tipe !== 'Usulan') {
      throw new Error('Aduan/Usulan tidak ditemukan atau bukan tipe Usulan.');
    }

    // Update status usulan to 'Proses'
    await prisma.aduanUsulan.update({
      where: { id: aduanUsulanId },
      data: { status: 'Proses' }
    });

    const { pertanyaan, opsi, tanggal_mulai, tanggal_selesai } = data;

    return await prisma.polling.create({
      data: {
        tenant_id: usulan.tenant_id,
        scope: usulan.scope,
        aduan_usulan_id: aduanUsulanId,
        pertanyaan,
        tanggal_mulai: dateUtils.normalize(tanggal_mulai || new Date().toISOString()),
        tanggal_selesai: tanggal_selesai ? dateUtils.normalize(tanggal_selesai) : null,
        opsi: {
          create: (opsi || []).map((teks: string) => ({ teks }))
        }
      },
      include: { opsi: true }
    });
  },

  async vote(pollingId: string, wargaId: string, opsiId: string) {
    // Check if citizen already voted
    const existingVote = await prisma.pollingVote.findUnique({
      where: {
        polling_id_warga_id: {
          polling_id: pollingId,
          warga_id: wargaId
        }
      }
    });

    if (existingVote) {
      throw new Error('Anda sudah berpartisipasi dalam polling ini.');
    }

    return await prisma.pollingVote.create({
      data: {
        polling_id: pollingId,
        warga_id: wargaId,
        opsi_id: opsiId
      }
    });
  },

  async getResults(pollingId: string) {
    return await prisma.polling.findUnique({
      where: { id: pollingId },
      include: {
        opsi: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        votes: {
          include: {
            warga: {
              select: { nama: true }
            }
          }
        }
      }
    });
  }
};
