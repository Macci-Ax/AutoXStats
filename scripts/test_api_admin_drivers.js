// Node 18+ has native fetch
fetch('http://localhost:3000/api/admin/all-drivers')
    .then(res => res.json())
    .then(data => {
        console.log('Count:', data.length);
        if (data.length > 0) {
            console.log('First Item:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('No drivers found.');
        }
    })
    .catch(err => console.error(err));
