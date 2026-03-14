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
    
    const item = await pembayaranIuranService.getById(id);
    if (!item || item.tenant_id !== user.tenant_id) {
      return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Iuran Warga', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      
      // Force tenant_id from session
      data.tenant_id = user.tenant_id;
      
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

      // Verify ownership
      const existing = await pembayaranIuranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
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

      // Verify ownership
      const existing = await pembayaranIuranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await pembayaranIuranService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
