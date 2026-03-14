import { FastifyInstance } from 'fastify';
import { agendaService } from '../services/agendaService';
import { requirePermission } from '../middleware/auth';

export default async function agendaRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Agenda', 'Lihat')] }, async (request, reply) => {
    const { scope, page, limit } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    return await agendaService.getAll(
        tenantId, 
        scope, 
        page ? parseInt(page) : 1, 
        limit ? parseInt(limit) : 20
    );
  });

  fastify.get('/:id', { preHandler: [requirePermission('Agenda', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await agendaService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Agenda', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;
      
      const item = await agendaService.create(data);
      return reply.code(201).send(item);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Agenda', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await agendaService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await agendaService.update(id, data);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Agenda', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await agendaService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await agendaService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
