import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
    const pengurus = await prisma.pengurus.findMany({
        include: { warga: true }
    });

    console.log('Total Pengurus:', pengurus.length);

    const seen = new Set();
    const duplicates = [];

    for (const p of pengurus) {
        const key = `${p.tenant_id}-${p.scope}-${p.warga_id}-${p.jabatan}-${p.periode}`;
        if (seen.has(key)) {
            duplicates.push(p);
        } else {
            seen.add(key);
        }
    }

    if (duplicates.length > 0) {
        console.log('Found duplicates:', duplicates.length);
        duplicates.forEach(d => {
            console.log(`Duplicate: ${d.jabatan} - ${d.warga?.nama} (${d.periode}) for tenant ${d.tenant_id}`);
        });
    } else {
        console.log('No exact duplicates found.');
    }

    // Check for person holding multiple active positions which might look like duplication if not explained
    const activeSeen = new Map();
    for (const p of pengurus) {
        if (p.status === 'aktif' || !p.status) {
            const key = `${p.tenant_id}-${p.scope}-${p.warga_id}`;
            if (activeSeen.has(key)) {
                console.log(`Warning: Person ${p.warga?.nama} holds multiple active positions in ${p.scope}: ${activeSeen.get(key)} and ${p.jabatan}`);
            } else {
                activeSeen.set(key, p.jabatan);
            }
        }
    }

    await prisma.$disconnect();
}

checkDuplicates();
