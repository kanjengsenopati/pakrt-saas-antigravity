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
import asetBookingRoutes from './routes/asetBookingRoutes';
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
import pushRoutes from './routes/pushRoutes';
import statsRoutes from './routes/statsRoutes';
import aduanRoutes from './routes/aduanRoutes';
import pollingRoutes from './routes/pollingRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import pricePackageRoutes from './routes/pricePackageRoutes';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCookie from '@fastify/cookie';

import { authenticate } from './middleware/auth';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}

const fastify = Fastify({
  logger: true,
  ignoreTrailingSlash: true
});

fastify.decorate('authenticate', authenticate);

fastify.register(fastifyCors, {
  origin: ['https://pakrtsaas.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});


fastify.register(fastifyMultipart);
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

fastify.register(fastifyCookie);

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'supersecret-rt-key-2026',
  cookie: {
    cookieName: 'auth_token',
    signed: false
  }
});

fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// API Routes Group
fastify.register(async (apiGroup) => {
  // Public routes
  apiGroup.register(authRoutes, { prefix: '/auth' });
  apiGroup.register(wilayahRoutes, { prefix: '/wilayah' });
  apiGroup.register(wilayahRoutes, { prefix: '/location' });
  apiGroup.register(superAdminRoutes, { prefix: '/super-admin' });
  apiGroup.register(pricePackageRoutes, { prefix: '/packages' });
  apiGroup.post('/test-upload', async () => ({ status: 'found' }));

  // Protected routes
  apiGroup.register(async (protectedRoutes) => {
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
    protectedRoutes.register(asetBookingRoutes, { prefix: '/aset/booking' });
    protectedRoutes.register(suratPengantarRoutes, { prefix: '/suratPengantar' });
    protectedRoutes.register(jadwalRondaRoutes, { prefix: '/jadwalRonda' });
    protectedRoutes.register(agendaRoutes, { prefix: '/agenda' });
    protectedRoutes.register(keuanganRoutes, { prefix: '/keuangan' });
    protectedRoutes.register(pembayaranIuranRoutes, { prefix: '/pembayaranIuran' });
    protectedRoutes.register(pembayaranIuranRoutes, { prefix: '/iuran' });
    protectedRoutes.register(aktivitasRoutes, { prefix: '/aktivitas' });
    protectedRoutes.register(anggotaKeluargaRoutes, { prefix: '/anggotaKeluarga' });
    protectedRoutes.register(userRoutes, { prefix: '/user' });
    protectedRoutes.register(userRoutes, { prefix: '/users' });
    protectedRoutes.register(roleRoutes, { prefix: '/role' });
    protectedRoutes.register(jadwalRondaRoutes, { prefix: '/ronda' });
    protectedRoutes.register(suratPengantarRoutes, { prefix: '/surat' });
    protectedRoutes.register(pushRoutes, { prefix: '/push' });
    protectedRoutes.register(statsRoutes, { prefix: '/stats' });
    protectedRoutes.register(aduanRoutes, { prefix: '/aduan' });
    protectedRoutes.register(pollingRoutes, { prefix: '/polling' });
    protectedRoutes.register(subscriptionRoutes, { prefix: '/subscription' });
    protectedRoutes.register(uploadRoutes);
  });
}, { prefix: '/api' });

fastify.get('/ping', async () => ({ status: 'ok', time: new Date().toISOString() }));

// Export for Vercel serverless functions
export default async function handler(req: any, res: any) {
  await fastify.ready();
  fastify.server.emit('request', req, res);
}

// Start server locally
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3100;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info('Server started on ' + port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
