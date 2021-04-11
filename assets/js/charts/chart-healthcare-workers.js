import { createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA } from './util'

function chart(chartData, lang) {
    var ctx = document.getElementById('chart-healthcare-workers');
    if (ctx) {
        var options = createDefaultChartOptions();
        var hcData = chartData.dailyHealthcareWorkers.slice(chartData.firstValidHealthcareWorkerIndex);
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.dates.slice(chartData.firstValidHealthcareWorkerIndex),
                datasets: [
                    createMovingAverageDataset(hcData, MOVING_AVERAGE_DELTA, "#0033bb88"),
                    {
                        backgroundColor: "#01C6B2FF",
                        label: lang.healthCareWorkerCases.other,
                        data: hcData,
                    },
                    {
                        backgroundColor: "#97DBEAFF",
                        label: lang.dailyCases.other,
                        data: chartData.dailyCases.slice(chartData.firstValidHealthcareWorkerIndex),
                    }]
            },
            options: options
        });
    }
}

export default chart;