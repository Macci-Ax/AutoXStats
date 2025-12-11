fetch('http://localhost:3000/api/drivers')
    .then(res => res.json())
    .then(data => {
        const withRank = data.filter(d => d.seasonRank > 0);
        console.log(`Drivers with rank: ${withRank.length}/${data.length}`);
        console.log('Sample:', withRank.slice(0, 3).map(d => ({ name: d.name, class: d.driverClass, rank: d.seasonRank })));
    })
    .catch(console.error);
