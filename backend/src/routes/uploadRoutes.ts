import { FastifyInstance } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import { requirePermission } from '../middleware/auth';
import streamifier from 'streamifier';

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto',
                transformation: [{ quality: 'auto:good', fetch_format: 'auto' }]
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error || new Error('Upload result is null'));
                }
                resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

export default async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', { preHandler: [requirePermission('Warga', 'Ubah')] }, async (request, reply) => {
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ error: 'No file uploaded' });
        }

        try {
            // Collect the file buffer from the multipart stream
            const chunks: Buffer[] = [];
            for await (const chunk of data.file) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            // Upload to Cloudinary (works in serverless environments)
            const secureUrl = await uploadToCloudinary(buffer, 'pakrt/documents');

            return { url: secureUrl };
        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Failed to upload file to cloud storage' });
        }
    });
}
