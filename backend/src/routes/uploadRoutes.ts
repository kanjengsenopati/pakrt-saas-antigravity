import { FastifyInstance } from 'fastify';
import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import { requirePermission } from '../middleware/auth';

const pump = promisify(pipeline);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export default async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', { preHandler: [requirePermission('Warga', 'Ubah')] }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ error: 'No file uploaded' });
        }

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const safeName = data.filename.replace(/[^a-zA-Z0-9.]/g, '_');
            const filename = `${timestamp}-${safeName}`;
            const filepath = path.join(UPLOADS_DIR, filename);

            // Save file
            await pump(data.file, fs.createWriteStream(filepath));

            // Return relative URL (served by fastify-static)
            return { url: `/uploads/${filename}` };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to save file to local storage' });
        }
    });
}
