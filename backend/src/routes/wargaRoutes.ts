import { FastifyInstance } from 'fastify';
import { wargaService } from '../services/wargaService';
import { requirePermission } from '../middleware/auth';

export default async function wargaRoutes(fastify: FastifyInstance) {
    // GET all warga
    fastify.get('/', { preHandler: [requirePermission('Warga', 'Lihat')] }, async (request, reply) => {
        const { scope, page, limit } = request.query as any;
        const user = (request as any).user;
        const tenantId = user.tenant_id;

        // Use permission scope from middleware
        const wargaIdFilter = (request as any).permissionScope === 'personal' ? user.warga_id : undefined;

        const result = await wargaService.getAll(
            tenantId, 
            scope, 
            wargaIdFilter, 
            page ? parseInt(page) : 1, 
            limit ? parseInt(limit) : 20
        );
        return result;
    });

    // GET single warga
    fastify.get('/:id', { preHandler: [requirePermission('Warga', 'Lihat')] }, async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = (request as any).user;

        // Restriction for 'personal' scope
        if ((request as any).permissionScope === 'personal' && user.warga_id !== id) {
            return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat melihat data diri sendiri.' });
        }

        const warga = await wargaService.getById(id);

        if (!warga || warga.tenant_id !== user.tenant_id) {
            return reply.code(404).send({ error: 'Warga not found or unauthorized' });
        }

        return warga;
    });

    // POST create warga
    fastify.post('/', { preHandler: [requirePermission('Warga', 'Buat')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const data = request.body as any;
            
            // Force tenant_id from session
            data.tenant_id = user.tenant_id;
            
            const newWarga = await wargaService.create(data);
            return reply.code(201).send(newWarga);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to create warga', details: error.message });
        }
    });

    // PUT update warga
    fastify.put('/:id', { preHandler: [requirePermission('Warga', 'Ubah')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;
            
            // Verify ownership before update
            const existing = await wargaService.getById(id);
            if (!existing || existing.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Warga not found or unauthorized' });
            }

            const data = request.body as any;
            data.tenant_id = user.tenant_id; // Prevent tenant jumping

            const updatedWarga = await wargaService.update(id, data);
            return updatedWarga;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to update warga', details: error.message });
        }
    });

    // DELETE warga
    fastify.delete('/:id', { preHandler: [requirePermission('Warga', 'Hapus')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;

            // Verify ownership before delete
            const existing = await wargaService.getById(id);
            if (!existing || existing.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Warga not found or unauthorized' });
            }

            await wargaService.delete(id);
            return reply.code(204).send();
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to delete warga' });
        }
    });
}
