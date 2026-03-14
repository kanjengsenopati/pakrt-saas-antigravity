import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATA = {
    "33.74.01": {
        name: "SEMARANG TENGAH",
        villages: [
            { id: "33.74.01.1001", name: "BRUMBUNGAN" },
            { id: "33.74.01.1002", name: "GABAHAN" },
            { id: "33.74.01.1003", name: "JAGALAN" },
            { id: "33.74.01.1004", name: "KARANGKIDUL" },
            { id: "33.74.01.1005", name: "KEMBANGSARI" },
            { id: "33.74.01.1006", name: "KRANGGAN" },
            { id: "33.74.01.1007", name: "MIROTO" },
            { id: "33.74.01.1008", name: "PANDANSARI" },
            { id: "33.74.01.1009", name: "PEKUNDEN" },
            { id: "33.74.01.1010", name: "PENDRIKAN KIDUL" },
            { id: "33.74.01.1011", name: "PENDRIKAN LOR" },
            { id: "33.74.01.1012", name: "PURWODINATAN" },
            { id: "33.74.01.1013", name: "SEKAYU" }
        ]
    },
    "33.74.02": {
        name: "SEMARANG UTARA",
        villages: [
            { id: "33.74.02.1001", name: "BANDARHARJO" },
            { id: "33.74.02.1002", name: "BULU LOR" },
            { id: "33.74.02.1003", name: "DADAPSARI" },
            { id: "33.74.02.1004", name: "KUNINGAN" },
            { id: "33.74.02.1005", name: "PANGGUNG KIDUL" },
            { id: "33.74.02.1006", name: "PANGGUNG LOR" },
            { id: "33.74.02.1007", name: "PLOMBOKAN" },
            { id: "33.74.02.1008", name: "PURWOSARI" },
            { id: "33.74.02.1009", name: "TANJUNG MAS" }
        ]
    },
    "33.74.03": {
        name: "SEMARANG TIMUR",
        villages: [
            { id: "33.74.03.1001", name: "BUGANGAN" },
            { id: "33.74.03.1002", name: "KARANGTEMPEL" },
            { id: "33.74.03.1003", name: "KARANGTURI" },
            { id: "33.74.03.1004", name: "KEBONAGUNG" },
            { id: "33.74.03.1005", name: "KEMIJEN" },
            { id: "33.74.03.1006", name: "MLATIBARU" },
            { id: "33.74.03.1007", name: "MLATIHARJO" },
            { id: "33.74.03.1008", name: "REJOMULYO" },
            { id: "33.74.03.1009", name: "REJOSARI" },
            { id: "33.74.03.1010", name: "SARIREJO" }
        ]
    },
    "33.74.04": {
        name: "GAYAMSARI",
        villages: [
            { id: "33.74.04.1001", name: "GAYAMSARI" },
            { id: "33.74.04.1002", name: "KALIGAWE" },
            { id: "33.74.04.1003", name: "PANDEAN LAMPER" },
            { id: "33.74.04.1004", name: "SAMBIREJO" },
            { id: "33.74.04.1005", name: "SAWAH BESAR" },
            { id: "33.74.04.1006", name: "SIWALAN" },
            { id: "33.74.04.1007", name: "TAMBAKREJO" }
        ]
    },
    "33.74.05": {
        name: "GENUK",
        villages: [
            { id: "33.74.05.1001", name: "BANGETAYU KULON" },
            { id: "33.74.05.1002", name: "BANGETAYU WETAN" },
            { id: "33.74.05.1003", name: "BANJARDOWO" },
            { id: "33.74.05.1004", name: "GEBANGSARI" },
            { id: "33.74.05.1005", name: "GENUKSARI" },
            { id: "33.74.05.1006", name: "KARANGROTO" },
            { id: "33.74.05.1007", name: "KUDU" },
            { id: "33.74.05.1008", name: "MUKTIHARJO LOR" },
            { id: "33.74.05.1009", name: "PENGGARON LOR" },
            { id: "33.74.05.1010", name: "SEMBUNGHARJO" },
            { id: "33.74.05.1011", name: "TERBOYO KULON" },
            { id: "33.74.05.1012", name: "TERBOYO WETAN" },
            { id: "33.74.05.1013", name: "TRIMULYO" }
        ]
    },
    "33.74.06": {
        name: "PEDURUNGAN",
        villages: [
            { id: "33.74.06.1001", name: "GEMAH" },
            { id: "33.74.06.1002", name: "KALICARI" },
            { id: "33.74.06.1003", name: "MUKTIHARJO KIDUL" },
            { id: "33.74.06.1004", name: "PALEBON" },
            { id: "33.74.06.1005", name: "PEDURUNGAN KIDUL" },
            { id: "33.74.06.1011", name: "PEDURUNGAN LOR" },
            { id: "33.74.06.1012", name: "PEDURUNGAN TENGAH" },
            { id: "33.74.06.1006", name: "PENGGARON KIDUL" },
            { id: "33.74.06.1007", name: "PLAMONGANSARI" },
            { id: "33.74.06.1008", name: "TLOGOMULYO" },
            { id: "33.74.06.1009", name: "TLOGOSARI KULON" },
            { id: "33.74.06.1010", name: "TLOGOSARI WETAN" }
        ]
    },
    "33.74.07": {
        name: "SEMARANG SELATAN",
        villages: [
            { id: "33.74.07.1001", name: "BARUSARI" },
            { id: "33.74.07.1002", name: "BULUSTALAN" },
            { id: "33.74.07.1003", name: "LAMPER KIDUL" },
            { id: "33.74.07.1004", name: "LAMPER LOR" },
            { id: "33.74.07.1005", name: "LAMPER TENGAH" },
            { id: "33.74.07.1006", name: "MUGASSARI" },
            { id: "33.74.07.1007", name: "PETERONGAN" },
            { id: "33.74.07.1008", name: "PLEBURAN" },
            { id: "33.74.07.1009", name: "RANDUSARI" },
            { id: "33.74.07.1010", name: "WONODRI" }
        ]
    },
    "33.74.08": {
        name: "CANDISARI",
        villages: [
            { id: "33.74.08.1001", name: "CANDI" },
            { id: "33.74.08.1002", name: "JATINGALEH" },
            { id: "33.74.08.1003", name: "JOMBLANG" },
            { id: "33.74.08.1004", name: "KALIWIRU" },
            { id: "33.74.08.1005", name: "KARANGANYAR GUNUNG" },
            { id: "33.74.08.1006", name: "TEGALSARI" },
            { id: "33.74.08.1007", name: "WONOTINGAL" }
        ]
    },
    "33.74.09": {
        name: "GAJAHMUNGKUR",
        villages: [
            { id: "33.74.09.1001", name: "BENDANDUWUR" },
            { id: "33.74.09.1002", name: "BENDAN NGISOR" },
            { id: "33.74.09.1003", name: "BENDUNGAN" },
            { id: "33.74.09.1004", name: "GAJAHMUNGKUR" },
            { id: "33.74.09.1005", name: "KARANGREJO" },
            { id: "33.74.09.1006", name: "LEMPONGSARI" },
            { id: "33.74.09.1007", name: "PETOMPON" },
            { id: "33.74.09.1008", name: "SAMPANGAN" }
        ]
    },
    "33.74.10": {
        name: "TEMBALANG",
        villages: [
            { id: "33.74.10.1001", name: "BULUSAN" },
            { id: "33.74.10.1002", name: "JANGLI" },
            { id: "33.74.10.1003", name: "KEDUNGMUNDU" },
            { id: "33.74.10.1004", name: "KRAMAS" },
            { id: "33.74.10.1005", name: "MANGUNHARJO" },
            { id: "33.74.10.1006", name: "METESEH" },
            { id: "33.74.10.1007", name: "ROWOSARI" },
            { id: "33.74.10.1008", name: "SAMBIROTO" },
            { id: "33.74.10.1009", name: "SENDANGGUWO" },
            { id: "33.74.10.1011", name: "SENDANGMULYO" },
            { id: "33.74.10.1012", name: "TANDANG" },
            { id: "33.74.10.1013", name: "TEMBALANG" }
        ]
    },
    "33.74.11": {
        name: "BANYUMANIK",
        villages: [
            { id: "33.74.11.1001", name: "BANYUMANIK" },
            { id: "33.74.11.1002", name: "GEDAWANG" },
            { id: "33.74.11.1003", name: "JABUNGAN" },
            { id: "33.74.11.1004", name: "NGESREP" },
            { id: "33.74.11.1005", name: "PADANGSARI" },
            { id: "33.74.11.1006", name: "PEDALANGAN" },
            { id: "33.74.11.1007", name: "PUDAKPAYUNG" },
            { id: "33.74.11.1008", name: "SRONDOL KULON" },
            { id: "33.74.11.1009", name: "SRONDOL WETAN" },
            { id: "33.74.11.1010", name: "SUMURBOTO" },
            { id: "33.74.11.1011", name: "TINJOMOYO" }
        ]
    },
    "33.74.12": {
        name: "GUNUNG PATI",
        villages: [
            { id: "33.74.12.1001", name: "CEPOKO" },
            { id: "33.74.12.1002", name: "GUNUNG PATI" },
            { id: "33.74.12.1003", name: "JATIREJO" },
            { id: "33.74.12.1004", name: "KALISEGORO" },
            { id: "33.74.12.1005", name: "KANDRI" },
            { id: "33.74.12.1006", name: "MANGUNSARI" },
            { id: "33.74.12.1007", name: "NGIJO" },
            { id: "33.74.12.1008", name: "NONGKOSAWIT" },
            { id: "33.74.12.1009", name: "PAKINTELAN" },
            { id: "33.74.12.1010", name: "PATEMON" },
            { id: "33.74.12.1011", name: "PLALANGAN" },
            { id: "33.74.12.1012", name: "PONGANGAN" },
            { id: "33.74.12.1013", name: "SADENG" },
            { id: "33.74.12.1014", name: "SEKARAN" },
            { id: "33.74.12.1015", name: "SUKOREJO" },
            { id: "33.74.12.1016", name: "SUMUREJO" }
        ]
    },
    "33.74.13": {
        name: "SEMARANG BARAT",
        villages: [
            { id: "33.74.13.1001", name: "BOJONGSALAMAN" },
            { id: "33.74.13.1002", name: "BONGSARI" },
            { id: "33.74.13.1003", name: "CABEAN" },
            { id: "33.74.13.1004", name: "GISIKDRONO" },
            { id: "33.74.13.1005", name: "KALIBANTENG KIDUL" },
            { id: "33.74.13.1006", name: "KALIBANTENG KULON" },
            { id: "33.74.13.1007", name: "KARANGAYU" },
            { id: "33.74.13.1008", name: "KEMBANGARUM" },
            { id: "33.74.13.1009", name: "KRAPYAK" },
            { id: "33.74.13.1010", name: "KROBOKAN" },
            { id: "33.74.13.1011", name: "MANYARAN" },
            { id: "33.74.13.1012", name: "NGEMPLAK SIMONGAN" },
            { id: "33.74.13.1013", name: "SALAMANMLOYO" },
            { id: "33.74.13.1014", name: "TAMBAKHARJO" },
            { id: "33.74.13.1015", name: "TAWANG MAS" },
            { id: "33.74.13.1016", name: "TAWANGSARI" }
        ]
    },
    "33.74.14": {
        name: "MIJEN",
        villages: [
            { id: "33.74.14.1001", name: "BUBAKAN" },
            { id: "33.74.14.1002", name: "CANGKIRAN" },
            { id: "33.74.14.1003", name: "JATIBARANG" },
            { id: "33.74.14.1004", name: "JATISARI" },
            { id: "33.74.14.1005", name: "KARANGMALANG" },
            { id: "33.74.14.1006", name: "KEDUNGPANE" },
            { id: "33.74.14.1007", name: "MIJEN" },
            { id: "33.74.14.1008", name: "NGADIRGO" },
            { id: "33.74.14.1009", name: "PESANTREN" },
            { id: "33.74.14.1010", name: "POLAMAN" },
            { id: "33.74.14.1011", name: "PURWOSARI" },
            { id: "33.74.14.1012", name: "TAMBANGAN" },
            { id: "33.74.14.1013", name: "WONOLOPO" },
            { id: "33.74.14.1014", name: "WONOPLUMBON" }
        ]
    },
    "33.74.15": {
        name: "NGALIYAN",
        villages: [
            { id: "33.74.15.1001", name: "BAMBANKEREP" },
            { id: "33.74.15.1002", name: "BRINGIN" },
            { id: "33.74.15.1003", name: "GONDORIYO" },
            { id: "33.74.15.1004", name: "KALIPANCUR" },
            { id: "33.74.15.1005", name: "NGALIYAN" },
            { id: "33.74.15.1006", name: "PODOREJO" },
            { id: "33.74.15.1007", name: "PURWOYOSO" },
            { id: "33.74.15.1008", name: "TAMBAKAJI" },
            { id: "33.74.15.1009", name: "WATES" },
            { id: "33.74.15.1010", name: "WONOSARI" }
        ]
    },
    "33.74.16": {
        name: "TUGU",
        villages: [
            { id: "33.74.16.1001", name: "JERAH" },
            { id: "33.74.16.1002", name: "KARANGANYAR" },
            { id: "33.74.16.1003", name: "MANGKANG KULON" },
            { id: "33.74.16.1004", name: "MANGKANG WETAN" },
            { id: "33.74.16.1005", name: "MANGUNHARJO" },
            { id: "33.74.16.1006", name: "RANDUGARUT" },
            { id: "33.74.16.1007", name: "TUGUREJO" }
        ]
    }
};

async function main() {
    console.log('Seeding administrative data (Jawa Tengah & Kota Semarang)...');

    // 1. Province
    await prisma.wilayah.upsert({
        where: { id: '33' },
        update: { name: 'JAWA TENGAH', level: 'provinsi' },
        create: { id: '33', name: 'JAWA TENGAH', level: 'provinsi' }
    });

    // 2. City
    await prisma.wilayah.upsert({
        where: { id: '33.74' },
        update: { name: 'KOTA SEMARANG', level: 'kabkota', parent_id: '33' },
        create: { id: '33.74', name: 'KOTA SEMARANG', level: 'kabkota', parent_id: '33' }
    });

    // 3. Districts and Villages
    for (const [distId, distData] of Object.entries(DATA)) {
        console.log(`- Seeding ${distData.name}...`);
        await prisma.wilayah.upsert({
            where: { id: distId },
            update: { name: (distData as any).name, level: 'kecamatan', parent_id: '33.74' },
            create: { id: distId, name: (distData as any).name, level: 'kecamatan', parent_id: '33.74' }
        });

        for (const village of (distData as any).villages) {
            await prisma.wilayah.upsert({
                where: { id: village.id },
                update: { name: village.name, level: 'keldesa', parent_id: distId },
                create: { id: village.id, name: village.name, level: 'keldesa', parent_id: distId }
            });

            // 4. RW 01-50 for each village
            const rwData = Array.from({ length: 50 }, (_, i) => {
                const rwNum = String(i + 1).padStart(2, '0');
                const rwId = `${village.id}.${rwNum}`;
                return { id: rwId, name: `RW ${rwNum}`, level: 'rw', parent_id: village.id };
            });

            // We use createMany for speed if possible, or batch
            // Since it's a seed, we'll use a transaction for each batch of RWs
            await prisma.wilayah.createMany({
                data: rwData,
                skipDuplicates: true
            });

            // 5. RT 01-25 for each RW
            // This is the largest part: 177 * 50 * 25 = 221,250 rows.
            // We will batch this to avoid memory issues
            for (const rw of rwData) {
                const rtData = Array.from({ length: 25 }, (_, i) => {
                    const rtNum = String(i + 1).padStart(3, '0');
                    const rtId = `${rw.id}.${rtNum}`;
                    return { id: rtId, name: `RT ${rtNum}`, level: 'rt', parent_id: rw.id };
                });

                await prisma.wilayah.createMany({
                    data: rtData,
                    skipDuplicates: true
                });
            }
        }
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
