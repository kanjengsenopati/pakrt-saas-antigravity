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
