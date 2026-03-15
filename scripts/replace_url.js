const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            if (content.includes("'http://localhost:3000/api'")) {
                content = content.replace(/'http:\/\/localhost:3000\/api'/g, "'/api'");
                modified = true;
            }
            if (content.includes('"http://localhost:3000/api"')) {
                content = content.replace(/"http:\/\/localhost:3000\/api"/g, "'/api'");
                modified = true;
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

replaceInDir(path.join(__dirname, '../src'));
console.log('Done replacing URLs');
