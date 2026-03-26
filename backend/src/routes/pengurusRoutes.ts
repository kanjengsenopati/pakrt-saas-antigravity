import { FastifyInstance } from 'fastify';
import { pengurusService } from '../services/pengurusService';
import { requirePermission } from '../middleware/auth';

export default async function pengurusRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Pengurus', 'Lihat')] }, async (request, reply) => {
    const { scope } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    return await pengurusService.getAll(tenantId, scope);
  });

  fastify.get('/count', { preHandler: [requirePermission('Pengurus', 'Lihat')] }, async (request, reply) => {
    const { scope } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    const count = await pengurusService.count(tenantId, scope);
    return { count };
  });

  fastify.get('/:id', { preHandler: [requirePermission('Pengurus', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await pengurusService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Pengurus', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;
      
      const item = await pengurusService.create(data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Pengurus', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await pengurusService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await pengurusService.update(id, data);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Pengurus', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await pengurusService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await pengurusService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
