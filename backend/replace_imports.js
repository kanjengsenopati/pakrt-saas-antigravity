const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const newContent = content
                .replace(/from '\.\.\/server'/g, "from '../prisma'")
                .replace(/from '\.\.\/\.\.\/server'/g, "from '../../prisma'");
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'src'));
