import { prisma } from '../prisma';
import { dateUtils } from '../utils/date';

export const notulensiService = {
  async getAll(tenantId: string, scope?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    return await prisma.notulensi.findMany({ where });
  },

  async getById(id: string) {
    return await prisma.notulensi.findUnique({ where: { id } });
  },

  async create(data: any) {
    const { kehadiran, ...notulensiData } = data;
    if (notulensiData.tanggal) notulensiData.tanggal = dateUtils.normalize(notulensiData.tanggal);
    
    const notulensi = await prisma.notulensi.create({ data: notulensiData });

    if (kehadiran) {
      const kehadiranArray = Array.isArray(kehadiran) ? kehadiran : Object.values(kehadiran);
      if (kehadiranArray.length > 0) {
        await prisma.kehadiran.createMany({
          data: kehadiranArray.map((k: any) => ({
            ...k,
            notulensi_id: notulensi.id,
            tenant_id: notulensi.tenant_id
          }))
        });
      }
    }

    return notulensi;
  },

  async update(id: string, data: any) {
    const { kehadiran, ...notulensiData } = data;
    if (notulensiData.tanggal) notulensiData.tanggal = dateUtils.normalize(notulensiData.tanggal);
    
    const notulensi = await prisma.notulensi.update({ 
      where: { id }, 
      data: notulensiData 
    });

    if (kehadiran) {
      const kehadiranArray = Array.isArray(kehadiran) ? kehadiran : Object.values(kehadiran);
      // Sync attendance: delete and recreate in one batch
      await prisma.kehadiran.deleteMany({ where: { notulensi_id: id } });
      if (kehadiranArray.length > 0) {
        await prisma.kehadiran.createMany({
          data: kehadiranArray.map((k: any) => ({
            ...k,
            notulensi_id: id,
            tenant_id: notulensi.tenant_id
          }))
        });
      }
    }
    return notulensi;
  },

  async delete(id: string) {
    return await prisma.notulensi.delete({ where: { id } });
  }
};
