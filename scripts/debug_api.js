
fetch('http://localhost:3000/api/drivers')
    .then(res => res.json())
    .then(drivers => {
        const byClass = {};
        drivers.forEach(d => {
            byClass[d.driverClass] = (byClass[d.driverClass] || 0) + 1;
        });
        console.log(byClass);
        console.log("Total drivers:", drivers.length);
    })
    .catch(err => console.error(err));
