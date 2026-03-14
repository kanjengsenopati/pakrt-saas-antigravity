import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Context to store tenantId across async calls within a request
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

const basePrisma = new PrismaClient();

// Extension to automatically apply tenant_id filtering to all queries
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

        if (context?.tenantId && multiTenantModels.includes(model)) {
          // READ operations: Inject tenant_id into 'where'
          if (['findMany', 'findFirst', 'findUnique', 'count', 'groupBy', 'aggregate'].includes(operation)) {
            const anyArgs = args as any;
            anyArgs.where = anyArgs.where || {};
            anyArgs.where.tenant_id = context.tenantId;
          } 
          // WRITE operations: Inject/Verify tenant_id
          else if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
            const anyArgs = args as any;
            anyArgs.where = anyArgs.where || {};
            anyArgs.where.tenant_id = context.tenantId;
          } 
          // CREATE operations: Force tenant_id
          else if (['create', 'createMany'].includes(operation)) {
            const anyArgs = args as any;
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

        return query(args);
      },
    },
  },
});
