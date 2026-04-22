import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware guard that restricts access to Super Admin users only.
 * Must be placed AFTER the standard `authenticate` middleware.
 */
export const requireSuperAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;

    if (!user || user.role !== 'super_admin') {
        return reply.code(403).send({
            error: 'Forbidden',
            message: 'Akses khusus Super Admin. Anda tidak memiliki otorisasi.'
        });
    }
};
