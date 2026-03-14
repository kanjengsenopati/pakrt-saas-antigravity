import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { prisma, tenantContext } from './prisma';
import wargaRoutes from './routes/wargaRoutes';
import authRoutes from './routes/authRoutes';
import pengaturanRoutes from './routes/pengaturanRoutes';
import pengurusRoutes from './routes/pengurusRoutes';
import notulensiRoutes from './routes/notulensiRoutes';
import kehadiranRoutes from './routes/kehadiranRoutes';
import asetRoutes from './routes/asetRoutes';
import suratPengantarRoutes from './routes/suratPengantarRoutes';
import jadwalRondaRoutes from './routes/jadwalRondaRoutes';
import agendaRoutes from './routes/agendaRoutes';
import keuanganRoutes from './routes/keuanganRoutes';
import pembayaranIuranRoutes from './routes/pembayaranIuranRoutes';
import aktivitasRoutes from './routes/aktivitasRoutes';
import wilayahRoutes from './routes/wilayahRoutes';
import anggotaKeluargaRoutes from './routes/anggotaKeluargaRoutes';
import uploadRoutes from './routes/uploadRoutes';
import userRoutes from './routes/userRoutes';
import roleRoutes from './routes/roleRoutes';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';

import { authenticate } from './middleware/auth';

const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true
});

fastify.register(fastifyCors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});


fastify.register(fastifyMultipart);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret-rt-key-2026'
});

fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Public routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(wilayahRoutes, { prefix: '/api/wilayah' });
fastify.post('/api/test-upload', async () => ({ status: 'found' }));

// Protected routes
fastify.register(async (protectedRoutes) => {
  protectedRoutes.addHook('preHandler', authenticate);
  
  // Wrap every protected request in a tenant context for automated Prisma isolation
  protectedRoutes.addHook('preHandler', (request, reply, done) => {
    const user = (request as any).user;
    if (user?.tenant_id) {
      tenantContext.run({ tenantId: user.tenant_id }, done);
    } else {
      done();
    }
  });

  protectedRoutes.register(wargaRoutes, { prefix: '/warga' });
  protectedRoutes.register(pengaturanRoutes, { prefix: '/pengaturan' });
  protectedRoutes.register(pengurusRoutes, { prefix: '/pengurus' });
  protectedRoutes.register(notulensiRoutes, { prefix: '/notulensi' });
  protectedRoutes.register(kehadiranRoutes, { prefix: '/kehadiran' });
  protectedRoutes.register(asetRoutes, { prefix: '/aset' });
  protectedRoutes.register(suratPengantarRoutes, { prefix: '/suratPengantar' });
  protectedRoutes.register(jadwalRondaRoutes, { prefix: '/jadwalRonda' });
  protectedRoutes.register(agendaRoutes, { prefix: '/agenda' });
  protectedRoutes.register(keuanganRoutes, { prefix: '/keuangan' });
  protectedRoutes.register(pembayaranIuranRoutes, { prefix: '/pembayaranIuran' });
  protectedRoutes.register(aktivitasRoutes, { prefix: '/aktivitas' });
  protectedRoutes.register(anggotaKeluargaRoutes, { prefix: '/anggotaKeluarga' });
  protectedRoutes.register(userRoutes, { prefix: '/user' });
  protectedRoutes.register(roleRoutes, { prefix: '/role' });
  protectedRoutes.register(uploadRoutes);
}, { prefix: '/api' });

fastify.get('/ping', async () => ({ status: 'ok', time: new Date().toISOString() }));

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info('Server started on ' + port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
