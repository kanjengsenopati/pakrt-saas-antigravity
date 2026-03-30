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
            'Keuangan', 'PembayaranIuran', 'Aktivitas', 'Pengaturan'
        ];

        // Models that have the deletedAt field (Soft Delete supported)
        const softDeleteModels = ['Warga', 'AnggotaKeluarga', 'Pengurus', 'SuratPengantar', 'Keuangan', 'PembayaranIuran'];

        const anyArgs = args as any;

        // 1. Tenant Isolation Injection
        if (context?.tenantId && multiTenantModels.includes(model)) {
          anyArgs.where = anyArgs.where || {};
          
          if (['findMany', 'findFirst', 'findUnique', 'count', 'groupBy', 'aggregate'].includes(operation)) {
            // Transformation: findUnique results in validation error if non-unique fields are added.
            // Converting to findFirst is safe and allows the extra filters.
            if (operation === 'findUnique') {
              return (basePrisma as any)[model].findFirst(anyArgs);
            }
            anyArgs.where.tenant_id = context.tenantId;
          } else if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
            anyArgs.where.tenant_id = context.tenantId;
          } else if (['create', 'createMany'].includes(operation)) {
            if (operation === 'create') {
              anyArgs.data = anyArgs.data || {};
              anyArgs.data.tenant_id = context.tenantId;
            } else if (operation === 'createMany') {
               if (Array.isArray(anyArgs.data)) {
                 anyArgs.data = anyArgs.data.map((item: any) => ({ ...item, tenant_id: context.tenantId }));
               }
            }
          }
        }

        // 2. Soft Delete: Filtering (Exclude deleted records from READ)
        if (softDeleteModels.includes(model)) {
          if (['findMany', 'findFirst', 'findUnique', 'count', 'groupBy', 'aggregate'].includes(operation)) {
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
                      const family = await (basePrisma as any).anggotaKeluarga.findMany({
                        where: { warga_id: record.id, deletedAt: null },
                        select: { id: true, nik: true }
                      });

                      for (const member of family) {
                        await (basePrisma as any).anggotaKeluarga.update({
                          where: { id: member.id },
                          data: { 
                            deletedAt: now,
                            nik: `${member.nik}::deleted::${now.getTime()}`
                          }
                        });
                      }
                      
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

        return query(args);
      },
    },
  },
});
