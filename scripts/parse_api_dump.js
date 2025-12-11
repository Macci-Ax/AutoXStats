
import fs from 'fs';
try {
    const data = JSON.parse(fs.readFileSync('drivers_check.json', 'utf8'));
    const fischers = data.filter(d => d.name.includes('Fischer'));
    console.log(JSON.stringify(fischers, null, 2));
} catch (e) {
    console.error(e);
}
