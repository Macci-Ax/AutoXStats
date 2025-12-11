
import fs from 'fs';

fetch('http://localhost:3000/api/drivers')
    .then(res => res.json())
    .then(data => {
        const fischers = data.filter(d => d.name.includes('Fischer'));
        fs.writeFileSync('fischer_api_check.txt', JSON.stringify(fischers, null, 2));
        console.log('Saved to fischer_api_check.txt');
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
