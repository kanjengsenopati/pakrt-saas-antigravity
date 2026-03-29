import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../prisma';

// declare module 'fastify' {
//     interface FastifyRequest {
//         user?: any; // The authenticated user object
//     }
// }

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        // Automatically verifies the JWT from Authorization header
        const decoded = await request.jwtVerify() as any;
        
        // Fetch user to confirm they still exist and get permissions/role
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { role_entity: true }
        });
 
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized', message: 'User not found' });
        }

        // Security reinforcement: Check if tenant in token matches DB
        if (user.tenant_id !== decoded.tenant_id) {
             return reply.code(401).send({ error: 'Unauthorized', message: 'Tenant mismatch' });
        }

        request.user = user;
    } catch (error) {
        request.log.error(error);
        return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
};

export const requirePermission = (moduleName: string, action: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (request as any).user;
            if (!user) {
                return reply.code(401).send({ error: 'Unauthorized', message: 'User not authenticated' });
            }

            // Combine direct user permissions and role permissions
            const userPerms = (user.permissions as any) || {};
            const rolePerms = (user.role_entity?.permissions as any) || {};
            
            const checkPermission = (perms: any): { granted: boolean; scope: 'all' | 'personal' } => {
                const moduleData = perms[moduleName];
                if (!moduleData) return { granted: false, scope: 'all' };

                // Handle legacy format: string[]
                if (Array.isArray(moduleData)) {
                    const hasAction = moduleData.includes(action) || moduleData.includes('manage');
                    return { granted: hasAction, scope: 'all' };
                }

                // Handle new format: { actions: string[], scope: 'all' | 'personal' }
                if (typeof moduleData === 'object' && Array.isArray(moduleData.actions)) {
                    const hasAction = moduleData.actions.includes(action) || moduleData.actions.includes('manage');
                    return { granted: hasAction, scope: moduleData.scope || 'all' };
                }

                return { granted: false, scope: 'all' };
            };

            const userAccess = checkPermission(userPerms);
            const roleAccess = checkPermission(rolePerms);

            // If granted by either, we need to attach the scope to the request for route-level enforcement
            if (userAccess.granted || roleAccess.granted) {
                // Priority: 'all' scope wins if granted by either
                const effectiveScope = (userAccess.granted && userAccess.scope === 'all') || (roleAccess.granted && roleAccess.scope === 'all') ? 'all' : 'personal';
                (request as any).permissionScope = effectiveScope;
                return;
            }

            // Allow if user has 'manage' permission on 'all'
            if (userPerms['all']?.includes('manage') || rolePerms['all']?.includes('manage')) {
                (request as any).permissionScope = 'all';
                return;
            }

            request.log.warn(`Forbidden: User ${(user as any).id} [Role: ${user.role_entity?.name}] attempting '${action}' on '${moduleName}' - Scope: User:${JSON.stringify(userPerms[moduleName])} Role:${JSON.stringify(rolePerms[moduleName])}`);
            return reply.code(403).send({ error: 'Forbidden', message: `You do not have permission to ${action} ${moduleName}` });
        } catch (error) {
            request.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error', message: 'Authorization check failed' });
        }
    };
};
