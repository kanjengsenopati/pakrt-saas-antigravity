import { FastifyInstance } from 'fastify';
import { notulensiService } from '../services/notulensiService';
import { requirePermission } from '../middleware/auth';

export default async function notulensiRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Notulensi', 'Lihat')] }, async (request, reply) => {
    const { scope } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    return await notulensiService.getAll(tenantId, scope);
  });

  fastify.get('/:id', { preHandler: [requirePermission('Notulensi', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await notulensiService.getById(id);
    
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
      
      const item = await notulensiService.create(data);
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

      const existing = await notulensiService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await notulensiService.update(id, data);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Notulensi', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await notulensiService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await notulensiService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
