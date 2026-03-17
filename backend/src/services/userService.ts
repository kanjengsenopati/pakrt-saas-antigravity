import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

const sanitizeUserData = (data: any) => {
    const {
        id: _id,
        tenant: _tenant,
        ...clean
    } = data;
    return clean;
};

export const userService = {
    async getAllByTenant(tenantId: string) {
        return await prisma.user.findMany({
            where: { tenant_id: tenantId },
            include: { role_entity: true },
            orderBy: { name: 'asc' }
        });
    },

    async getById(id: string) {
        return await prisma.user.findUnique({
            where: { id },
            include: { role_entity: true }
        });
    },

    async create(data: any) {
        const createData = { ...data };
        if (createData.password) {
            createData.password = await bcrypt.hash(createData.password, 10);
        }

        // Handle legacy 'role' field which is required in schema
        if (!createData.role && createData.role_id) {
            const roleEntity = await prisma.role.findUnique({
                where: { id: createData.role_id }
            });
            if (roleEntity) {
                createData.role = roleEntity.name.toLowerCase();
            }
        }

        // Fallback if still missing (should not happen with role_id, but for safety)
        if (!createData.role) {
            createData.role = 'staff';
        }

        return await prisma.user.create({
            data: sanitizeUserData(createData),
            include: { role_entity: true }
        });
    },

    async update(id: string, data: any) {
        const updateData = { ...data };
        
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        // Sync legacy 'role' field if role_id is updated
        if (updateData.role_id && !updateData.role) {
            const roleEntity = await prisma.role.findUnique({
                where: { id: updateData.role_id }
            });
            if (roleEntity) {
                updateData.role = roleEntity.name.toLowerCase();
            }
        }

        return await prisma.user.update({
            where: { id },
            data: sanitizeUserData(updateData),
            include: { role_entity: true }
        });
    },

    async delete(id: string) {
        return await prisma.user.delete({
            where: { id }
        });
    }
};
