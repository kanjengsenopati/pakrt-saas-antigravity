import { FastifyInstance } from 'fastify';
import { userService } from '../services/userService';
import { requirePermission } from '../middleware/auth';

export default async function userRoutes(fastify: FastifyInstance) {
    fastify.get('/', { preHandler: [requirePermission('Manajemen User / Role', 'Lihat')] }, async (request, reply) => {
        const user = (request as any).user;
        const tenantId = user.tenant_id;
        const users = await userService.getAllByTenant(tenantId);
        return users;
    });

    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const userSession = (request as any).user;
        
        // Allow if user is an admin OR if they are requesting their own profile
        const isAdmin = userSession.role?.toLowerCase() === 'admin' || userSession.role_entity?.name === 'Admin';
        const isSelf = userSession.id === id;

        if (!isAdmin && !isSelf) {
            // Manual check for permission
            const userPerms = (userSession.permissions as any) || {};
            const rolePerms = (userSession.role_entity?.permissions as any) || {};
            
            const check = (perms: any) => {
                const data = perms['Manajemen User / Role'];
                if (!data) return false;
                if (Array.isArray(data)) return data.includes('Lihat') || data.includes('manage');
                return data.actions?.includes('Lihat') || data.actions?.includes('manage');
            };

            if (!check(userPerms) && !check(rolePerms)) {
                return reply.code(403).send({ error: 'Forbidden' });
            }
        }

        const user = await userService.getById(id);

        if (!user || user.tenant_id !== userSession.tenant_id) {
            return reply.code(404).send({ error: 'User not found or unauthorized' });
        }

        return user;
    });

    fastify.post('/', { preHandler: [requirePermission('Manajemen User / Role', 'Buat')] }, async (request, reply) => {
        try {
            const userSession = (request as any).user;
            const data = request.body as any;
            data.tenant_id = userSession.tenant_id;
            
            const newUser = await userService.create(data);
            return reply.code(201).send(newUser);
        } catch (error: any) {
            fastify.log.error('USER_CREATE_ERROR:', error);
            
            // Handle Prisma unique constraint violations (P2002)
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                
                // Flexible check for target as array or string
                const checkTarget = (field: string) => {
                    if (Array.isArray(target)) return target.includes(field);
                    if (typeof target === 'string') return target.includes(field);
                    return false;
                };

                if (checkTarget('email')) {
                    return reply.code(409).send({ error: 'Email sudah terdaftar. Gunakan email lain.' });
                }
                if (checkTarget('warga_id')) {
                    return reply.code(409).send({ error: 'Warga ini sudah memiliki akun user.' });
                }
                return reply.code(409).send({ 
                    error: 'Data duplikat terdeteksi', 
                    details: `Conflict on: ${target}`
                });
            }

            return reply.code(500).send({ 
                error: 'Gagal membuat user', 
                message: error.message,
                code: error.code
            });
        }
    });

    fastify.put('/:id', { preHandler: [requirePermission('Manajemen User / Role', 'Ubah')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userSession = (request as any).user;
            
            const existing = await userService.getById(id);
            if (!existing || existing.tenant_id !== userSession.tenant_id) {
                return reply.code(404).send({ error: 'User not found or unauthorized' });
            }

            // Allow if admin or management permission
            const isAdmin = userSession.role?.toLowerCase() === 'admin' || userSession.role_entity?.name === 'Admin';
            if (!isAdmin) {
                const userPerms = (userSession.permissions as any) || {};
                const rolePerms = (userSession.role_entity?.permissions as any) || {};
                const check = (perms: any) => {
                    const data = perms['Manajemen User / Role'];
                    if (!data) return false;
                    if (Array.isArray(data)) return data.includes('Ubah') || data.includes('manage');
                    return data.actions?.includes('Ubah') || data.actions?.includes('manage');
                };
                if (!check(userPerms) && !check(rolePerms)) {
                    return reply.code(403).send({ error: 'Forbidden' });
                }
            }

            const data = request.body as any;
            data.tenant_id = userSession.tenant_id;

            const updatedUser = await userService.update(id, data);
            return updatedUser;
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to update user', details: error.message });
        }
    });

    fastify.delete('/:id', { preHandler: [requirePermission('Manajemen User / Role', 'Hapus')] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const userSession = (request as any).user;

            const existing = await userService.getById(id);
            if (!existing || existing.tenant_id !== userSession.tenant_id) {
                return reply.code(404).send({ error: 'User not found or unauthorized' });
            }

            await userService.delete(id);
            return reply.code(204).send();
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to delete user' });
        }
    });
}
