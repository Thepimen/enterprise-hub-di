const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../node_modules/@ionic/angular/package.json');

try {
  if (fs.existsSync(targetPath)) {
    const pkg = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    if (!pkg.exports) {
      pkg.exports = {};
    }
    if (!pkg.exports['./standalone']) {
      pkg.exports['./standalone'] = {
        types: './dist/standalone/index.d.ts',
        default: './dist/standalone/index.js'
      };
      fs.writeFileSync(targetPath, JSON.stringify(pkg, null, 2), 'utf8');
      console.log('✓ Successfully ensured @ionic/angular/standalone export compatibility.');
    }
  }
} catch (error) {
  console.warn('Note: Could not patch @ionic/angular package.json (might be pre-installed):', error.message);
}
