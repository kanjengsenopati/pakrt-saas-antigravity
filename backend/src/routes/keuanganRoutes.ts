import { FastifyInstance } from 'fastify';
import { keuanganService } from '../services/keuanganService';
import { requirePermission } from '../middleware/auth';

export default async function keuanganRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Buku Kas / Transaksi', 'Lihat')] }, async (request, reply) => {
    const { scope, page, limit } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;

    const result = await keuanganService.getAll(
        tenantId, 
        scope,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
    );
    return result;
  });

  fastify.get('/:id', { preHandler: [requirePermission('Buku Kas / Transaksi', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await keuanganService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Buku Kas / Transaksi', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await keuanganService.create(data);
      return reply.code(201).send(item);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Buku Kas / Transaksi', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await keuanganService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await keuanganService.update(id, data);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Buku Kas / Transaksi', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await keuanganService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await keuanganService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
