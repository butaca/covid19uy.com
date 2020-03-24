document.addEventListener("DOMContentLoaded", function (event) {
    main();
});

function main() {
    //FIXME: get from somewhere instead of hardcoding the values
    var data = [
        { date: '2020-03-13', cases : 4 },
        { date: '2020-03-14', cases : 6 },
        { date: '2020-03-15', cases : 8 },
        { date: '2020-03-16', cases : 29 },
        { date: '2020-03-17', cases : 50 },
        { date: '2020-03-18', cases : 79 },
        { date: '2020-03-19', cases : 94 },
        { date: '2020-03-20', cases : 110 },
        { date: '2020-03-21', cases : 135 },
        { date: '2020-03-22', cases : 158 },
        { date: '2020-03-23', cases : 162 },
    ]

    var cases =  data.map( function(el) { return el.cases });
    var deaths = data.map( function(el) { return el.deaths != undefined ? el.deaths : 0 });
    var dates = data.map(function(el) {
        var date = new Date(el.date);
        return date.getUTCDate() + "/" + (date.getUTCMonth() + 1)
    });

    var ctx = document.getElementById('chart');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                pointBackgroundColor: "#28b8d6ff",
                backgroundColor: "#28b8d680",
                label: 'Casos',
                data: cases,
            },
            {
                pointBackgroundColor: "#e54acfff",
                backgroundColor: "#e54acfff",
                label: 'Muertes',
                data: deaths,
            }]
        },
    });
}
