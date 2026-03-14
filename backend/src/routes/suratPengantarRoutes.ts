import { FastifyInstance } from 'fastify';
import { suratPengantarService } from '../services/suratPengantarService';
import { requirePermission } from '../middleware/auth';

export default async function suratPengantarRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Surat / Cetak', 'Lihat')] }, async (request, reply) => {
    const { scope, page, limit } = request.query as any;
    const user = (request as any).user;
    const tenantId = user.tenant_id;
    
    const wargaIdFilter = (request as any).permissionScope === 'personal' ? user.warga_id : undefined;
    return await suratPengantarService.getAll(
        tenantId, 
        scope, 
        wargaIdFilter,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20
    );
  });

  fastify.get('/:id', { preHandler: [requirePermission('Surat / Cetak', 'Lihat')] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user;
    const item = await suratPengantarService.getById(id);
    
    if (!item || item.tenant_id !== user.tenant_id) {
        return reply.code(404).send({ error: 'Not found or unauthorized' });
    }

    // RBAC: personal scope restriction
    if ((request as any).permissionScope === 'personal' && item.warga_id !== user.warga_id) {
        return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat melihat data surat milik sendiri.' });
    }

    return item;
  });

  fastify.post('/', { preHandler: [requirePermission('Surat / Cetak', 'Buat')] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await suratPengantarService.create(data);
      return reply.code(201).send(item);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to create' });
    }
  });

  fastify.put('/:id', { preHandler: [requirePermission('Surat / Cetak', 'Ubah')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await suratPengantarService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      const data = request.body as any;
      data.tenant_id = user.tenant_id;

      const item = await suratPengantarService.update(id, data);
      return item;
    } catch (err: any) {
      fastify.log.error(err);
      return reply.code(400).send({ error: err.message || 'Failed to update' });
    }
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Surat / Cetak', 'Hapus')] }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const user = (request as any).user;

      const existing = await suratPengantarService.getById(id);
      if (!existing || existing.tenant_id !== user.tenant_id) {
          return reply.code(404).send({ error: 'Not found or unauthorized' });
      }

      await suratPengantarService.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
