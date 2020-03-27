import data from "../../data/uruguay.json";

document.addEventListener("DOMContentLoaded", function (event) {
    main();
});

function main() {
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
        options: {
            animation: {
                duration: 0
            }
        }
    });

    var dialyCases = [];
    var prevDayCases = 0;
    for(var i = 0; i < cases.length; ++i) {
        var todayCases = cases[i];
        dialyCases.push(todayCases - prevDayCases);
        prevDayCases = todayCases;
    }

    ctx = document.getElementById('chart2');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                pointBackgroundColor: "#83d02aff",
                backgroundColor: "#83d02a80",
                label: 'Casos Diarios',
                data: dialyCases,
            }] 
        },
        options: {
            animation: {
                duration: 0
            }
        }
    });
}
