const fs = require('fs');

const content = fs.readFileSync('src/data/productos.json', 'utf8');
const fixed = content.replace(/,(\s*[}\]])/g, '$1');
fs.writeFileSync('src/data/productos.json', fixed);
console.log('JSON syntax fixed');
