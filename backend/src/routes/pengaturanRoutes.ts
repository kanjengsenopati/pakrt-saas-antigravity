import { FastifyInstance } from 'fastify';
import { pengaturanService } from '../services/pengaturanService';
import { requirePermission } from '../middleware/auth';

export default async function pengaturanRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const { scope } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    return await pengaturanService.getAll(tenantId, scope);
  });

  fastify.get('/key', async (request, reply) => {
    const { tenant_id, scope, key } = request.query as any;
    // Fallback to user tenant if not provided
    const user = (request as any).user;
    const tId = tenant_id || user?.tenant_id;
    
    if (!tId || !key) {
        return reply.code(400).send({ error: 'tenant_id and key are required' });
    }

    const item = await pengaturanService.getByKey(tId, scope || 'RT', key);
    if (!item) {
        return reply.code(404).send({ error: 'Setting not found' });
    }
    return item;
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await pengaturanService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Setup / Pengaturan', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;
      
      const item = await pengaturanService.create(data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Setup / Pengaturan', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await pengaturanService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await pengaturanService.update(id, data);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Setup / Pengaturan', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await pengaturanService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await pengaturanService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
