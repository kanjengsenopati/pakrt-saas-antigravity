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

    // Export Warga to XLSX
    fastify.get('/export', { preHandler: [requirePermission('Warga', 'Lihat')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const { scope } = request.query as any;
            const buffer = await wargaService.exportToXlsx(user.tenant_id, scope);
            
            reply
                .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                .header('Content-Disposition', 'attachment; filename=data_warga.xlsx')
                .send(buffer);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Gagal mengekspor data', details: error.message });
        }
    });

    // Import Warga from XLSX
    fastify.post('/import', { preHandler: [requirePermission('Warga', 'Buat')] }, async (request, reply) => {
        try {
            const user = (request as any).user;
            const data = await request.file();
            
            if (!data) {
                return reply.code(400).send({ error: 'File tidak ditemukan' });
            }

            const buffer = await data.toBuffer();
            const result = await wargaService.importFromXlsx(user.tenant_id, buffer);
            return { message: 'Import sukses', count: result.count };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(400).send({ error: error.message });
        }
    });

    // Download Import Template
    fastify.get('/template', { preHandler: [requirePermission('Warga', 'Buat')] }, async (request, reply) => {
        try {
            const buffer = await wargaService.getImportTemplate();
            
            reply
                .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                .header('Content-Disposition', 'attachment; filename=template_import_warga.xlsx')
                .send(buffer);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Gagal mengunduh template', details: error.message });
        }
    });

    // GET pending warga
    fastify.get('/pending', { preHandler: [requirePermission('Warga', 'Buat')] }, async (request, reply) => {
        const user = (request as any).user;
        return await wargaService.getPending(user.tenant_id);
    });

    // POST verify warga
    fastify.post('/verify/:id', { preHandler: [requirePermission('Warga', 'Buat')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const { status } = request.body as { status: 'VERIFIED' | 'REJECTED' };
            
            if (!['VERIFIED', 'REJECTED'].includes(status)) {
                return reply.code(400).send({ error: 'Status tidak valid' });
            }

            return await wargaService.updateStatus(id, status);
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Gagal memproses verifikasi', details: error.message });
        }
    });
}
