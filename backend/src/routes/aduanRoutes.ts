import { FastifyInstance } from 'fastify';
import { aduanService } from '../services/aduanService';
import { pollingService } from '../services/pollingService';
import { requirePermission } from '../middleware/auth';

export default async function aduanRoutes(fastify: FastifyInstance) {
  // Main list for Aduan & Usulan
  fastify.get('/', { preHandler: [requirePermission('Aduan & Usulan', 'Lihat')] }, async (request, reply) => {
    const { scope, status, tipe, page, limit } = request.query as any;
    const user = (request as any).user;
    
    // RBAC: if permission is personal, restrict to own entries
    const wargaIdFilter = (request as any).permissionScope === 'personal' ? user.warga_id : undefined;
    
    return await aduanService.getAll(
      user.tenant_id,
      scope,
      status,
      tipe,
      wargaIdFilter,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  });

  // Aggregated stats for the dashboard
  fastify.get('/stats', { preHandler: [requirePermission('Aduan & Usulan', 'Lihat')] }, async (request, reply) => {
    const { scope } = request.query as any;
    const user = (request as any).user;
    return await aduanService.getStats(user.tenant_id, scope);
  });

  // Single entry details
  fastify.get('/:id', { preHandler: [requirePermission('Aduan & Usulan', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await aduanService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
      return reply.code(404).send({ error: 'Data tidak ditemukan atau akses ditolak.' });
    }

    // RBAC: personal scope restriction
    if ((request as any).permissionScope === 'personal' && item.warga_id !== user.warga_id) {
      return reply.code(403).send({ error: 'Akses ditolak.' });
    }

    return item;
  });

  // Create new Aduan/Usulan
  fastify.post('/', { preHandler: [requirePermission('Aduan & Usulan', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      
      if (!user.warga_id) {
        return reply.code(403).send({ error: 'Hanya warga yang dapat mengirim aduan/usulan.' });
      }

      data.tenant_id = user.tenant_id;
      data.warga_id = user.warga_id;
      data.status = 'Menunggu';
      data.tanggal = new Date().toISOString().split('T')[0];

      const item = await aduanService.create(data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Gagal membuat aduan/usulan.' });
    }
  });

  // Update Aduan/Usulan (status, feedback, or content)
  fastify.patch('/:id', { preHandler: [requirePermission('Aduan & Usulan', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;
      const data = request.body as any;
      
      const existing = await aduanService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Data tidak ditemukan.' });
      }

      // Security: Residents cannot modify Pengurus feedback or status directly
      if ((request as any).permissionScope === 'personal') {
        if (existing.status !== 'Menunggu') {
          return reply.code(400).send({ error: 'Data yang sudah diproses tidak dapat diubah.' });
        }
        delete data.status;
        delete data.tanggapan;
      }

      const item = await aduanService.update(id, data);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Gagal memperbarui data.' });
    }
  });

  // Convert Usulan to Polling
  fastify.post('/:id/convert-to-polling', { preHandler: [requirePermission('Aduan & Usulan', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const data = request.body as any;
      const item = await pollingService.createFromUsulan(id, data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Gagal membuat polling.' });
    }
  });

  // Delete Aduan/Usulan
  fastify.delete('/:id', { preHandler: [requirePermission('Aduan & Usulan', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await aduanService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Data tidak ditemukan.' });
      }

      await aduanService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Gagal menghapus data.' });
    }
  });
}
