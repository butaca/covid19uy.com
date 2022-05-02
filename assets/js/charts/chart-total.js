import { getTotal, createDefaultChartOptions, pieToolTips } from './util'

function chart(_, lang, uruguayWeeklyData) {
    var ctx = document.getElementById('chart-total');
    if (ctx) {
        var htmlLang = document.documentElement.getAttribute("lang");
        
        const week = uruguayWeeklyData.data[uruguayWeeklyData.data.length - 1];
        const activeCases = week.active;
        const totalDeaths = week.totalDeaths;
        const totalCases = week.totalCases;
        const recovered = totalCases - totalDeaths - activeCases;

        var dataChartTotal = [activeCases, recovered, totalDeaths];
        var totalChartTotal = getTotal(dataChartTotal);
        var labelsChartTotal = [lang.activeCases.other, lang.recovered.other, lang.deaths.other];
        labelsChartTotal = labelsChartTotal.map(function (label, index) { return label + ': ' + (dataChartTotal[index] / totalChartTotal * 100).toFixed(2) + '%' });

        var options = createDefaultChartOptions();
        options.scales = {
            xAxes: [{
                display: false
            }],
            yAxes: [{
                display: false
            }]
        };
        options.elements = {
            center: {
                text: lang.totalCases.other + ': ' + totalCases.toLocaleString(htmlLang),
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
        };
        options.tooltips = pieToolTips;
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsChartTotal,
                datasets: [{
                    data: dataChartTotal,
                    backgroundColor: ["#28b8d680", "#0000ff80", "#e54acfff"]
                }]
            },
            options: options
        });
    }

}

export default chart;