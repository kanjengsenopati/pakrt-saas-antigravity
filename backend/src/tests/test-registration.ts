import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://127.0.0.1:3000/api';
const prisma = new PrismaClient();

async function testRegistration() {
    console.log('Testing registration API...');

    const registrationData = {
        tenantData: {
            id: '33.74.10.1011.01.001',
            name: 'RT 001 RW 01 Sendangmulyo',
            subdomain: 'rt001-rw01-sendangmulyo',
            config: { theme: 'emerald' }
        },
        userData: {
            role: 'admin',
            name: 'Test Admin',
            email: 'test-admin@pakrt.id',
            kontak: '08123456789',
            password: 'password123'
        }
    };

    try {
        // 1. Delete existing test data if any
        await prisma.user.deleteMany({ where: { email: 'test-admin@pakrt.id' } });
        await prisma.tenant.deleteMany({ where: { id: '33.74.10.1011.01.001' } });

        // 2. Call Register API
        const response = await axios.post(`${API_URL}/auth/register`, registrationData);
        console.log('API Response:', response.data);

        if (response.status === 200 || response.status === 201) {
            console.log('✅ Registration API call successful.');
        }

        // 3. Verify in Database
        const tenant = await prisma.tenant.findUnique({ where: { id: '33.74.10.1011.01.001' } });
        const user = await prisma.user.findFirst({ where: { email: 'test-admin@pakrt.id' } });

        if (tenant && user && user.role === 'admin') {
            console.log('✅ Database verification successful.');
            console.log('User Permissions:', JSON.stringify(user.permissions, null, 2));

            if (user.permissions && (user.permissions as any)['Warga'].includes('Lihat')) {
                console.log('✅ Default permissions assigned correctly.');
            } else {
                console.log('❌ Default permissions missing or incorrect.');
            }
        } else {
            console.log('❌ Database verification failed.');
        }

    } catch (error: any) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testRegistration();
