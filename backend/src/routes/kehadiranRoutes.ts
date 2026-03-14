import { FastifyInstance } from 'fastify';
import { kehadiranService } from '../services/kehadiranService';
import { requirePermission } from '../middleware/auth';

export default async function kehadiranRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Notulensi', 'Lihat')] }, async (request, reply) => {
    const { scope, notulensi_id } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    return await kehadiranService.getAll(tenantId, scope, notulensi_id);
  });

  fastify.get('/:id', { preHandler: [requirePermission('Notulensi', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await kehadiranService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Notulensi', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;
      
      const item = await kehadiranService.create(data);
      return reply.code(201).send(item);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Notulensi', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await kehadiranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await kehadiranService.update(id, data);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.post('/sync', { preHandler: [requirePermission('Notulensi', 'Ubah')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { notulensi_id, data } = request.body as any;
      const tenantId = user.tenant_id;
      return await kehadiranService.syncForNotulensi(tenantId, notulensi_id, data);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to sync' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Notulensi', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await kehadiranService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await kehadiranService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
