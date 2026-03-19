import { FastifyInstance } from 'fastify';
import { anggotaKeluargaService } from '../services/anggotaKeluargaService';
import { requirePermission } from '../middleware/auth';
import { wargaService } from '../services/wargaService';

export default async function anggotaKeluargaRoutes(fastify: FastifyInstance) {
    fastify.get('/', { preHandler: [requirePermission('Warga', 'Lihat')] }, async (request, reply) => {
        const query = request.query as any;
        const user = (request as any).user;
        const scope = (request as any).permissionScope;

        if (query.warga_id) {
            // Restriction for 'personal' scope
            if (scope === 'personal' && user.warga_id !== query.warga_id) {
                return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat melihat data keluarga sendiri.' });
            }

            // Verify warga belongs to tenant
            const warga = await wargaService.getById(query.warga_id);
            if (!warga || warga.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Warga not found or unauthorized' });
            }
            const anggota = await anggotaKeluargaService.getByWargaId(query.warga_id);
            return anggota;
        }

        // getAll in service should be filtered by tenant? 
        if (scope === 'personal') {
            return await anggotaKeluargaService.getByWargaId(user.warga_id);
        }

        return reply.code(400).send({ error: 'warga_id is required for administrative view' });
    });

    fastify.post('/', { preHandler: [requirePermission('Warga', 'Buat')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const data = request.body as any;
            const scope = (request as any).permissionScope;
            
            // Restriction for 'personal' scope
            if (scope === 'personal' && user.warga_id !== data.warga_id) {
                return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat mengelola data keluarga sendiri.' });
            }

            // Verify target warga belongs to tenant
            const warga = await wargaService.getById(data.warga_id);
            if (!warga || warga.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Parent Warga not found or unauthorized' });
            }

            // Force tenant_id on the record itself if it exists in schema
            data.tenant_id = user.tenant_id;

            const newAnggota = await anggotaKeluargaService.create(data);
            return reply.code(201).send(newAnggota);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: error.message || 'Failed' });
        }
    });

    fastify.put('/:id', { preHandler: [requirePermission('Warga', 'Ubah')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;
            const scope = (request as any).permissionScope;
            
            const existing = await anggotaKeluargaService.getById(id);
            if (!existing) return reply.code(404).send({ error: 'Not found' });

            // Restriction for 'personal' scope
            if (scope === 'personal' && user.warga_id !== existing.warga_id) {
                return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat mengelola data keluarga sendiri.' });
            }

            // Verify parent warga belongs to tenant
            const warga = await wargaService.getById(existing.warga_id);
            if (!warga || warga.tenant_id !== user.tenant_id) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            const data = request.body as any;
            const updatedAnggota = await anggotaKeluargaService.update(id, data);
            return updatedAnggota;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed' });
        }
    });

    fastify.delete('/:id', { preHandler: [requirePermission('Warga', 'Hapus')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;
            const scope = (request as any).permissionScope;

            const existing = await anggotaKeluargaService.getById(id);
            if (!existing) return reply.code(204).send();

            // Restriction for 'personal' scope
            if (scope === 'personal' && user.warga_id !== existing.warga_id) {
                return reply.code(403).send({ error: 'Forbidden', message: 'Anda hanya dapat mengelola data keluarga sendiri.' });
            }

            // Verify parent warga belongs to tenant
            const warga = await wargaService.getById(existing.warga_id);
            if (!warga || warga.tenant_id !== user.tenant_id) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }

            await anggotaKeluargaService.delete(id);
            return reply.code(204).send();
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed' });
        }
    });
}
