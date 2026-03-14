import { FastifyInstance } from 'fastify';
import { aktivitasService } from '../services/aktivitasService';
import { requirePermission } from '../middleware/auth';

export default async function aktivitasRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Log Aktivitas', 'Lihat')] }, async (request, reply) => {
    const { scope, page, limit } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    return await aktivitasService.getAll(
        tenantId, 
        scope, 
        page ? parseInt(page) : 1, 
        limit ? parseInt(limit) : 20
    );
  });

  fastify.get('/:id', { preHandler: [requirePermission('Log Aktivitas', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await aktivitasService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', async (request, reply) => {
    try {
      const item = await aktivitasService.create(request.body);
      return reply.code(201).send(item);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create' });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const item = await aktivitasService.update(id, request.body);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      await aktivitasService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
