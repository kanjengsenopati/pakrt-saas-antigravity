import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@pakrt.id';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@2026!';
    const name = 'Super Admin PakRT';

    console.log('🔐 Seeding Super Admin account...');

    // Create SYSTEM tenant if not exists
    const systemTenant = await prisma.tenant.upsert({
        where: { id: 'SYSTEM' },
        update: {},
        create: {
            id: 'SYSTEM',
            name: 'PakRT Platform',
            subdomain: 'platform',
            subscription_status: 'ACTIVE',
            subscription_plan: 'PREMIUM',
            subscription_until: new Date('2099-12-31'),
        }
    });
    console.log(`  ✅ System Tenant: ${systemTenant.id}`);

    // Create Super Admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const superAdmin = await prisma.user.upsert({
        where: { email },
        update: {
            name,
            password: hashedPassword,
            role: 'super_admin',
        },
        create: {
            tenant_id: 'SYSTEM',
            name,
            email,
            password: hashedPassword,
            role: 'super_admin',
            scope: 'PLATFORM',
            verification_status: 'VERIFIED',
            permissions: { all: { actions: ['manage'], scope: 'all' } }
        }
    });

    console.log(`  ✅ Super Admin User: ${superAdmin.email}`);
    console.log(`  🔑 Default Password: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
}

seedSuperAdmin()
    .then(() => {
        console.log('\n🎉 Super Admin seeded successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed to seed Super Admin:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
