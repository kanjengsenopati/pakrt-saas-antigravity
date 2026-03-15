import { FastifyInstance } from 'fastify';
import { authService } from '../services/authService';
import bcrypt from 'bcryptjs';

export default async function authRoutes(fastify: FastifyInstance) {
    // Simple login mock (no real password check for now)
    fastify.post('/login', async (request, reply) => {
        const { email, contactOrEmail, password } = request.body as any;
        const identifier = contactOrEmail || email;

        if (!identifier || !password) {
            return reply.code(400).send({ error: 'Email/No. Whatsapp dan password wajib diisi.' });
        }

        const user = await authService.getUserByIdentifier(identifier);

        if (!user) {
            return reply.code(404).send({ error: 'Akun tidak ditemukan. Silakan periksa kembali kredensial Anda.' });
        }

        // Password check (securely using bcrypt)
        let isMatch = await bcrypt.compare(password, user.password || '').catch(() => false);
        
        // Graceful migration for plain-text passwords (temporary)
        if (!isMatch && user.password === password) {
            isMatch = true;
            // Immediate migration: Hash the password for next login
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await authService.updatePassword(user.id, hashedPassword);
            fastify.log.info(`Migrated plain-text password for user: ${user.email}`);
        }

        if (!isMatch) {
            return reply.code(401).send({ error: 'Password yang Anda masukkan salah.' });
        }

        // Check verification_status
        if (user.verification_status !== 'VERIFIED') {
            const statusMsg = user.verification_status === 'PENDING' 
                ? 'Akun Anda sedang dalam proses verifikasi oleh Admin RT. Silakan tunggu.' 
                : 'Akun Anda ditolak oleh Admin RT.';
            return reply.code(403).send({ error: 'Akses Ditolak', message: statusMsg });
        }

        // Generate a real JWT token
        const token = fastify.jwt.sign({ 
            id: user.id, 
            tenant_id: user.tenant_id,
            role: user.role,
            scope: user.scope 
        }, { expiresIn: '1d' });

        // Return a session token and user data
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenant_id: user.tenant_id,
                warga_id: user.warga_id,
                scope: user.scope,
                kontak: user.kontak,
                permissions: user.permissions,
                role_entity: user.role_entity
            }
        };
    });

    // Check tenant existence
    fastify.get('/tenant/:id', async (request, reply) => {
        const { id } = request.params as any;
        const tenant = await authService.getTenantById(id);
        return { exists: !!tenant, tenant };
    });

    // Register a new tenant and admin
    fastify.post('/register', async (request, reply) => {
        const { tenantData, userData } = request.body as any;

        try {
            const result = await authService.register(tenantData, userData);
            return {
                message: 'Registration successful',
                ...result
            };
        } catch (error: any) {
            return reply.code(400).send({ error: error.message || 'Registration failed' });
        }
    });

    // Warga self-join route
    fastify.post('/join', async (request, reply) => {
        const { tenantId, residentData } = request.body as any;

        if (!tenantId || !residentData) {
            return reply.code(400).send({ error: 'Data tidak lengkap.' });
        }

        try {
            const result = await authService.joinResident(tenantId, residentData);
            return {
                message: 'Pendaftaran berhasil. Silakan tunggu verifikasi dari Admin RT.',
                ...result
            };
        } catch (error: any) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Pendaftaran gagal.', details: error.message });
        }
    });
}
