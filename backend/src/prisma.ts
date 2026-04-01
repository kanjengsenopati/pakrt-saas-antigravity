import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Context to store tenantId across async calls within a request
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

const basePrisma = new PrismaClient();

// Extension to automatically apply tenant_id filtering and soft delete handling
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const context = tenantContext.getStore();
        
        // List of models that require tenant isolation
        const multiTenantModels = [
            'User', 'Warga', 'Role', 'AnggotaKeluarga', 'Pengurus', 'Notulensi', 
            'Kehadiran', 'Aset', 'SuratPengantar', 'JadwalRonda', 'Agenda', 
            'Keuangan', 'PembayaranIuran', 'Aktivitas', 'Pengaturan',
            'Polling', 'PollingVote'
        ];

        // Models that have the deletedAt field (Soft Delete supported)
        const softDeleteModels = ['Warga', 'AnggotaKeluarga', 'Pengurus', 'SuratPengantar', 'Keuangan', 'PembayaranIuran'];

        let currentOperation = operation;
        const anyArgs = (args || {}) as any;
        
        // 1. Transformation: findUnique results in validation error if non-unique fields (like tenant_id or deletedAt) are added.
        // Converting to findFirst is safe and allows the extra filters.
        if (operation === 'findUnique' && (multiTenantModels.includes(model) || softDeleteModels.includes(model))) {
            const hasTenantFilter = multiTenantModels.includes(model) && context?.tenantId;
            const hasSoftDeleteFilter = softDeleteModels.includes(model);

            if (hasTenantFilter || hasSoftDeleteFilter) {
               currentOperation = 'findFirst' as any;
            }
        }

        // 2. Tenant Isolation Injection
        if (context?.tenantId && multiTenantModels.includes(model)) {
          if (['findMany', 'findFirst', 'count', 'groupBy', 'aggregate'].includes(currentOperation as string)) {
            anyArgs.where = anyArgs.where || {};
            anyArgs.where.tenant_id = context.tenantId;
          } else if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(currentOperation as string)) {
            anyArgs.where = anyArgs.where || {};
            anyArgs.where.tenant_id = context.tenantId;
          } else if (['create', 'createMany'].includes(currentOperation as string)) {
            if (currentOperation === 'create') {
              anyArgs.data = anyArgs.data || {};
              anyArgs.data.tenant_id = context.tenantId;
            } else if (currentOperation === 'createMany') {
               if (Array.isArray(anyArgs.data)) {
                 anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, tenant_id: context.tenantId }));
               }
            }
          }
        }

        // 3. Soft Delete: Filtering (Exclude deleted records from READ)
        if (softDeleteModels.includes(model)) {
          if (['findMany', 'findFirst', 'findUnique', 'count', 'groupBy', 'aggregate'].includes(currentOperation as string)) {
            anyArgs.where = anyArgs.where || {};
            // Only add if not explicitly searching for deleted records
            if (anyArgs.where.deletedAt === undefined) {
              anyArgs.where.deletedAt = null;
            }
          }
        }

        // 3. Soft Delete: Intercepting Deletion (Transform to Update)
        if (softDeleteModels.includes(model) && (operation === 'delete' || operation === 'deleteMany')) {
          const now = new Date();
          
          if (operation === 'delete') {
            // Check for cascading requirement or unique field suffixing (Warga/NIK)
            if (model === 'Warga' || model === 'AnggotaKeluarga') {
                const record = await (basePrisma as any)[model].findUnique({
                    where: anyArgs.where,
                    select: { nik: true, id: true }
                });
                
                if (record) {
                    // Manual Cascading for Warga
                    if (model === 'Warga') {
                      await (basePrisma as any).anggotaKeluarga.updateMany({
                        where: { warga_id: record.id, deletedAt: null },
                        data: { deletedAt: now }
                      });
                      
                      await (basePrisma as any).pengurus.updateMany({
                        where: { warga_id: record.id, deletedAt: null },
                        data: { deletedAt: now }
                      });
                    }

                    return (basePrisma as any)[model].update({
                        where: { id: record.id },
                        data: { 
                            deletedAt: now,
                            nik: `${record.nik}::deleted::${now.getTime()}`
                        }
                    });
                }
            }

            // Manual Cascading for PembayaranIuran
            if (model === 'PembayaranIuran') {
              const payment = await (basePrisma as any).pembayaranIuran.findUnique({
                where: anyArgs.where,
                select: { id: true }
              });
              
              if (payment) {
                await (basePrisma as any).keuangan.updateMany({
                  where: { pembayaranIuranId: payment.id, deletedAt: null },
                  data: { deletedAt: now }
                });
              }
            }

            // Standard Soft Delete for other models
            return (basePrisma as any)[model].update({
              where: anyArgs.where,
              data: { deletedAt: now },
            });
          } else {
            // deleteMany -> updateMany
            return (basePrisma as any)[model].updateMany({
              where: anyArgs.where,
              data: { deletedAt: now },
            });
          }
        }

        try {
          // If we transformed findUnique to findFirst, we call findFirst explicitly via basePrisma 
          // because query callback expects the ORIGINAL operation's arguments/return types.
          if (operation === 'findUnique' && (currentOperation as string) === 'findFirst') {
              return (basePrisma as any)[model].findFirst(anyArgs);
          }
          return query(anyArgs);
        } catch (error) {
           console.error(`[Prisma Extension Error] Model: ${model}, Operation: ${operation}, Args:`, JSON.stringify(anyArgs, null, 2));
           throw error;
        }
      },
    },
  },
});
