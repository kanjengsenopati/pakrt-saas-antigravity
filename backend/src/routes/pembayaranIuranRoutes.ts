import { FastifyInstance } from 'fastify';
import { pembayaranIuranService } from '../services/pembayaranIuranService';
import { requirePermission } from '../middleware/auth';

export default async function pembayaranIuranRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Iuran Warga', 'Lihat')] }, async (request, reply) => {
    const { scope, page, limit } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;

    const wargaIdFilter = (request as any).permissionScope === 'personal' ? user.warga_id : undefined;
    const result = await pembayaranIuranService.getAll(
        tenantId, 
        scope, 
        wargaIdFilter,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
    );
    return result;
  });

  fastify.get('/:id', { preHandler: [requirePermission('Iuran Warga', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const scope = (request as any).permissionScope;
    
    const item = await pembayaranIuranService.getById(id);
    if (!item || item.tenant_id !== user.tenant_id) {
      return reply.code(404).send({ error: 'Not found or unauthorized' });
    }

    // Restriction for 'personal' scope
    if (scope === 'personal' && user.warga_id !== item.warga_id) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat melihat data iuran sendiri.' });
    }

    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Iuran Warga', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      
      // Force tenant_id from session
      data.tenant_id = user.tenant_id;
      
      const isWarga = user.role?.toLowerCase() === 'warga' || user.role_entity?.name?.toLowerCase() === 'warga';
      data._autoVerify = !isWarga;
      
      const item = await pembayaranIuranService.create(data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ error: err.message || 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Iuran Warga', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;
      const scope = (request as any).permissionScope;

      // Verify ownership
      const existing = await pembayaranIuranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      // Restriction for 'personal' scope
      if (scope === 'personal' && user.warga_id !== existing.warga_id) {
        return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat mengubah data iuran sendiri.' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await pembayaranIuranService.update(id, data);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ error: err.message || 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Iuran Warga', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;
      const scope = (request as any).permissionScope;

      // Verify ownership
      const existing = await pembayaranIuranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      // Restriction for 'personal' scope
      if (scope === 'personal' && user.warga_id !== existing.warga_id) {
        return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat menghapus data iuran sendiri.' });
      }

      await pembayaranIuranService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });

  fastify.post('/:id/verify', { preHandler: [requirePermission('Iuran Warga', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { action, alasan } = request.body as any;
      const user = (request as any).user;

      // Verify ownership & tenant
      const existing = await pembayaranIuranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const item = await pembayaranIuranService.verify(id, action, alasan);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(500).send({ error: err.message || 'Failed to verify' });
    }
  });

  fastify.get('/billing/:wargaId', { preHandler: [requirePermission('Iuran Warga', 'Lihat')] }, async (request, reply) => {
    const { wargaId } = request.params as any;
    const { tahun, kategori, scope } = request.query as any;
    const user = (request as any).user;

    // Security: Warga can only see their own billing
    if ((request as any).permissionScope === 'personal' && user.warga_id !== wargaId) {
      return reply.code(403).send({ error: 'Forbidden: Cannot access other citizen billing' });
    }

    const result = await pembayaranIuranService.getBillingSummary(
      user.tenant_id,
      wargaId,
      tahun ? parseInt(tahun) : new Date().getFullYear(),
      kategori || 'Iuran Warga',
      scope || 'RT'
    );
    return result;
  });
}
