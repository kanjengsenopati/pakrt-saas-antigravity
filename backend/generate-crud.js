const fs = require('fs');
const path = require('path');

const models = [
    'pengaturan', 'pengurus', 'notulensi', 'kehadiran', 'aset',
    'suratPengantar', 'jadwalRonda', 'agenda', 'keuangan',
    'pembayaranIuran', 'aktivitas', 'wilayah'
];

models.forEach(model => {
    const serviceName = `${model}Service`;
    const routeName = `${model}Routes`;

    const serviceCode = `import { prisma } from '../server';

export const ${serviceName} = {
  async getAll(tenantId: string, scope?: string) {
    const where: any = {};
    if (tenantId) where.tenant_id = tenantId;
    if (scope) where.scope = scope;
    return await prisma.${model}.findMany({ where });
  },

  async getById(id: string) {
    return await prisma.${model}.findUnique({ where: { id } });
  },

  async create(data: any) {
    return await prisma.${model}.create({ data });
  },

  async update(id: string, data: any) {
    return await prisma.${model}.update({ where: { id }, data });
  },

  async delete(id: string) {
    return await prisma.${model}.delete({ where: { id } });
  }
};
`;
    fs.writeFileSync(path.join(__dirname, `src/services/${serviceName}.ts`), serviceCode);

    const routeCode = `import { FastifyInstance } from 'fastify';
import { ${serviceName} } from '../services/${serviceName}';

export default async function ${routeName}(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    const { tenant_id, scope } = request.query as any;
    return await ${serviceName}.getAll(tenant_id, scope);
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const item = await ${serviceName}.getById(id);
    if (!item) return reply.code(404).send({ error: 'Not found' });
    return item;
  });

  fastify.post('/', async (request, reply) => {
    try {
      const item = await ${serviceName}.create(request.body);
      return reply.code(201).send(item);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to create' });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      const item = await ${serviceName}.update(id, request.body);
      return item;
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to update' });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as any;
      await ${serviceName}.delete(id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Failed to delete' });
    }
  });
}
`;
    fs.writeFileSync(path.join(__dirname, `src/routes/${routeName}.ts`), routeCode);
});

let imports = "import fastifyCors from '@fastify/cors';\nimport { PrismaClient } from '@prisma/client';\nimport wargaRoutes from './routes/wargaRoutes';\nimport authRoutes from './routes/authRoutes';\n";
let registrations = "// Register routes\nfastify.register(wargaRoutes, { prefix: '/api/warga' });\nfastify.register(authRoutes, { prefix: '/api/auth' });\n";

models.forEach(model => {
    const routeName = `${model}Routes`;
    imports += `import ${routeName} from './routes/${routeName}';\n`;
    registrations += `fastify.register(${routeName}, { prefix: '/api/${model}' });\n`;
});

const serverTs = `import Fastify from 'fastify';\n` + imports + `\nconst fastify = Fastify({ logger: true });\nexport const prisma = new PrismaClient();\n\nfastify.register(fastifyCors, { origin: '*' });\n\n` + registrations + `\nfastify.get('/ping', async () => ({ status: 'ok', time: new Date().toISOString() }));\n\nconst start = async () => {\n  try {\n    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;\n    await fastify.listen({ port, host: '0.0.0.0' });\n    fastify.log.info('Server started on ' + port);\n  } catch (err) {\n    fastify.log.error(err);\n    process.exit(1);\n  }\n};\nstart();\n`;

fs.writeFileSync(path.join(__dirname, 'src/server.ts'), serverTs);
console.log('Successfully generated all CRUD files and updated server.ts!');
