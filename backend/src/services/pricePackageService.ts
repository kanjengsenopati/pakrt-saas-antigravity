import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const pricePackageService = {
  async getAll() {
    return prisma.pricePackage.findMany({
      orderBy: { price: 'asc' },
    });
  },

  async getActive() {
    return prisma.pricePackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  },

  async getById(id: string) {
    return prisma.pricePackage.findUnique({
      where: { id },
    });
  },

  async create(data: {
    name: string;
    description?: string;
    price: number;
    duration: number;
    duration_unit: string;
    features: any[];
  }) {
    return prisma.pricePackage.create({
      data: {
        ...data,
        features: data.features || [],
      },
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    duration: number;
    duration_unit: string;
    features: any[];
    isActive: boolean;
  }>) {
    return prisma.pricePackage.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    // Check if package has invoices
    const invoiceCount = await prisma.subscriptionInvoice.count({
      where: { pricePackageId: id },
    });

    if (invoiceCount > 0) {
      // Soft delete if has invoices
      return prisma.pricePackage.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.pricePackage.delete({
      where: { id },
    });
  },
};
