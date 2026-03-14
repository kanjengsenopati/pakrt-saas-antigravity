import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    const province = await prisma.wilayah.findUnique({ where: { id: '33' } });
    const city = await prisma.wilayah.findUnique({ where: { id: '33.74' } });
    const districts = await prisma.wilayah.count({ where: { level: 'kecamatan', parent_id: '33.74' } });
    const villages = await prisma.wilayah.count({ where: { level: 'keldesa' } });
    const rws = await prisma.wilayah.count({ where: { level: 'rw' } });
    const rts = await prisma.wilayah.count({ where: { level: 'rt' } });

    console.log('Verification Results:');
    console.log(`- Province: ${province ? province.name : 'Missing'}`);
    console.log(`- City: ${city ? city.name : 'Missing'}`);
    console.log(`- Districts: ${districts}`);
    console.log(`- Villages: ${villages}`);
    console.log(`- Total RWs: ${rws}`);
    console.log(`- Total RTs: ${rts}`);

    if (rws > 0 && rts > 0) {
        console.log('✅ Data exists in database.');
    } else {
        console.log('❌ Data missing or incomplete.');
    }

}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
