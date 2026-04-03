const fs = require('fs');

const files = [
    'src/features/warga/WargaPortal.tsx',
    'src/features/dashboard/Dashboard.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace class-[Xpx] and !class-[Xpx]
    const regex = /(!?)([a-zA-Z0-9\-]+)-\[(\d+(\.\d+)?)px\]/g;
    content = content.replace(regex, (match, bang, prefix, val) => {
        const num = parseFloat(val);
        const rem = num / 16;
        return `${bang}${prefix}-[${rem}rem]`;
    });
    
    fs.writeFileSync(file, content);
});

console.log('Tailwind arbitrary px converted to rem!');
