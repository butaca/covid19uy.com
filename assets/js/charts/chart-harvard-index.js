function chart(chartData, lang) {
    const colors = [];
    for (let i = 0; i < chartData.harvardIndexDaily.length; ++i) {
        const harvardIndex = chartData.harvardIndexDaily[i];
        let color;
        if (harvardIndex < 1) {
            color = "green";
        }
        else if (harvardIndex < 10) {
            color = "yellow";
        }
        else if (harvardIndex < 25) {
            color = "orange";
        }
        else {
            color = "red";
        }
        colors.push(color);
    }

    var ctx = document.getElementById('chart-harvard-index');
    if (ctx) {
        var options = {
            legend: {
                display: false
            }
        };
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.dates.length - chartData.harvardIndexDaily.length),
                datasets: [
                    {
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: colors,
                        label: lang.activeCases.other,
                        data: chartData.harvardIndexDaily,
                    }
                ]
            },
            options: options
        });
    }
}

export default chart;