import { FastifyInstance } from 'fastify';
import { wilayahService } from '../services/wilayahService';
import { requirePermission, authenticate } from '../middleware/auth';

export default async function wilayahRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    try {
      const { level, parent_id } = request.query as any;
      return await wilayahService.getAll(undefined, level, parent_id);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Database connection failed', message: (err as Error).message });
    }
  });
  
  // Specific routes for location service
  fastify.get('/provinsi', async () => {
    return await wilayahService.getAll(undefined, 'provinsi');
  });

  fastify.get('/kabkota/:parentId', async (request) => {
    const { parentId } = request.params as any;
    return await wilayahService.getAll(undefined, 'kabkota', parentId);
  });

  fastify.get('/kecamatan/:parentId', async (request) => {
    const { parentId } = request.params as any;
    return await wilayahService.getAll(undefined, 'kecamatan', parentId);
  });

  fastify.get('/keldesa/:parentId', async (request) => {
    const { parentId } = request.params as any;
    return await wilayahService.getAll(undefined, 'keldesa', parentId);
  });

  fastify.get('/rw/:parentId', async (request) => {
    const { parentId } = request.params as any;
    return await wilayahService.getAll(undefined, 'rw', parentId);
  });

  fastify.get('/rt/:parentId', async (request) => {
    const { parentId } = request.params as any;
    return await wilayahService.getAll(undefined, 'rt', parentId);
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const item = await wilayahService.getById(id);
    if (!item) return reply.code(404).send({ error: 'Not found' });
    return item;
  });
  
  // Alias for /id/:id to match locationService frontend calls
  fastify.get('/id/:id', async (request, reply) => {
    const { id } = request.params as any;
    const item = await wilayahService.getById(id);
    if (!item) return reply.code(404).send({ error: 'Not found' });
    return item;
  });

  // Mutation of global wilayah is restricted
  fastify.post('/bulk', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    // Only allow if no tenant context or specific system admin (mocking check)
    if (user.tenant_id) {
        return reply.code(403).send({ error: 'Only system admins can modify global wilayah data' });
    }
    try {
      const { data } = request.body as any;
      const result = await wilayahService.createMany(data);
      return reply.code(201).send(result);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to bulk create' });
    }
  });

  fastify.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    if (user.tenant_id) {
        return reply.code(403).send({ error: 'Only system admins can modify global wilayah data' });
    }
    try {
      const { id } = request.params as any;
      const item = await wilayahService.update(id, request.body);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const user = (request as any).user;
    if (user.tenant_id) {
        return reply.code(403).send({ error: 'Only system admins can modify global wilayah data' });
    }
    try {
      const { id } = request.params as any;
      await wilayahService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
