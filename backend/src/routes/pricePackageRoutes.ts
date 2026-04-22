import { FastifyInstance } from 'fastify';
import { pricePackageService } from '../services/pricePackageService';
import { requireSuperAdmin } from '../middleware/superAdminGuard';
import { authenticate } from '../middleware/auth';

export default async function pricePackageRoutes(fastify: FastifyInstance) {
  // Public listing (accessible by tenants)
  fastify.get('/', async () => {
    return await pricePackageService.getActive();
  });

  // Admin routes
  fastify.register(async (adminGroup) => {
    adminGroup.addHook('preHandler', authenticate);
    adminGroup.addHook('preHandler', requireSuperAdmin);

    adminGroup.get('/all', async () => {
      return await pricePackageService.getAll();
    });

    adminGroup.post('/', async (request) => {
      const data = request.body as any;
      return await pricePackageService.create(data);
    });

    adminGroup.put('/:id', async (request) => {
      const { id } = request.params as any;
      const data = request.body as any;
      return await pricePackageService.update(id, data);
    });

    adminGroup.delete('/:id', async (request) => {
      const { id } = request.params as any;
      return await pricePackageService.delete(id);
    });
  });
}
