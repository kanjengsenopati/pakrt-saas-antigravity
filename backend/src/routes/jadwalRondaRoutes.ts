import { FastifyInstance } from 'fastify';
import { jadwalRondaService } from '../services/jadwalRondaService';
import { requirePermission } from '../middleware/auth';

export default async function jadwalRondaRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Jadwal Ronda', 'Lihat')] }, async (request, reply) => {
    const user = (request as any).user;
    const { scope } = request.query as any;
    const tenantId = user.tenant_id;

    const wargaIdFilter = (request as any).permissionScope === 'personal' ? user.warga_id : undefined;
    return await jadwalRondaService.getAll(tenantId, scope, wargaIdFilter);
  });

  fastify.get('/:id', { preHandler: [requirePermission('Jadwal Ronda', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await jadwalRondaService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }
    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Jadwal Ronda', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;
      
      const item = await jadwalRondaService.create(data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Jadwal Ronda', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await jadwalRondaService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await jadwalRondaService.update(id, data);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Jadwal Ronda', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await jadwalRondaService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await jadwalRondaService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
