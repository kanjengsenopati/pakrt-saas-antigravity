import { FastifyInstance } from 'fastify';
import { asetBookingService } from '../services/asetBookingService';
import { requirePermission } from '../middleware/auth';

export default async function asetBookingRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requirePermission('Aset', 'Lihat')] }, async (request, reply) => {
    const { aset_id, status } = request.query as any;
    const user = (request as any).user;
    return await asetBookingService.getAll(user.tenant_id, aset_id, status);
  });

  fastify.post('/', { preHandler: [requirePermission('Aset', 'Pinjam')] }, async (request, reply) => {
    const user = (request as any).user;
    const data = request.body as any;
    data.tenant_id = user.tenant_id;
    if (!data.warga_id) data.warga_id = user.warga_id;
    
    return await asetBookingService.create(data);
  });

  fastify.put('/:id/status', { preHandler: [requirePermission('Aset', 'Ubah')] }, async (request, reply) => {
    const { id } = request.params as any;
    const { status, catatan_admin } = request.body as any;
    return await asetBookingService.updateStatus(id, status, catatan_admin);
  });

  fastify.delete('/:id', { preHandler: [requirePermission('Aset', 'Hapus')] }, async (request, reply) => {
    const { id } = request.params as any;
    return await asetBookingService.delete(id);
  });
}
