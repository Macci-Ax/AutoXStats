
import fetch from 'node-fetch';

async function check() {
    try {
        const response = await fetch('http://localhost:3000/api/drivers');
        const data = await response.json();

        const dennis = data.filter(d =>
            d.driver &&
            d.driver.name.includes('Dennis Hagedorn') &&
            (d.driverClass.includes('Klasse 06') || d.driverClass.includes('Klasse 6'))
        );

        console.log("Found " + dennis.length + " entries for Dennis Hagedorn:");
        dennis.forEach(entry => {
            console.log(JSON.stringify(entry, null, 2));
        });

    } catch (err) {
        console.error("Error:", err);
    }
}

check();
