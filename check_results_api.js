
import fetch from 'node-fetch';

async function checkApi() {
    try {
        const response = await fetch('http://localhost:3000/api/events/pe_e1/results');
        const data = await response.json();
        if (data.length > 0) {
            console.log("First result:", JSON.stringify(data[0], null, 2));
            const withRuns = data.filter(r => r.run_1 !== null);
            console.log(`Results with runs: ${withRuns.length} / ${data.length}`);
            if (withRuns.length > 0) {
                console.log("First result with run:", JSON.stringify(withRuns[0], null, 2));
            }
        } else {
            console.log("No results found.");
        }
    } catch (e) {
        console.error(e);
    }
}

checkApi();
