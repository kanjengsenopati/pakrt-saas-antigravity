import { FastifyInstance } from 'fastify';
import { anggotaKeluargaService } from '../services/anggotaKeluargaService';
import { requirePermission } from '../middleware/auth';
import { wargaService } from '../services/wargaService';

export default async function anggotaKeluargaRoutes(fastify: FastifyInstance) {
    fastify.get('/', { preHandler: [requirePermission('Manajemen Warga', 'Lihat')] }, async (request, reply) => {
        const query = request.query as any;
        const user = (request as any).user;

        if (query.warga_id) {
            // Verify warga belongs to tenant
            const warga = await wargaService.getById(query.warga_id);
            if (!warga || warga.tenant_id !== user.tenant_id) {
                return reply.code(404).send({ error: 'Warga not found or unauthorized' });
            }
            const anggota = await anggotaKeluargaService.getByWargaId(query.warga_id);
            return anggota;
        }

        // getAll in service should be filtered by tenant? 
        // Let's check anggotaKeluargaService later. 
        // For now, if no warga_id, maybe we don't want to expose ALL members of ALL tenants.
        return reply.code(400).send({ error: 'warga_id is required' });
    });

    fastify.post('/', { preHandler: [requirePermission('Manajemen Warga', 'Buat')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const data = request.body as any;
            
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

    fastify.put('/:id', { preHandler: [requirePermission('Manajemen Warga', 'Ubah')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;
            
            const existing = await anggotaKeluargaService.getById(id);
            if (!existing) return reply.code(404).send({ error: 'Not found' });

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

    fastify.delete('/:id', { preHandler: [requirePermission('Manajemen Warga', 'Hapus')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const user = (request as any).user;

            const existing = await anggotaKeluargaService.getById(id);
            if (!existing) return reply.code(204).send();

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
