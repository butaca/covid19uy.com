import { createDefaultChartOptions, } from './util'
import region from "../data/region.json";
import population from "../data/worldPopulation.json";

function chart(chartData, lang) {
    var regionDays = Math.min(chartData.dates.length, region.data.argentina.cases.length);

    region.data.uruguay = {
        dates: chartData.dates,
        cases: chartData.cases,
        recovered: chartData.recovered,
        deaths: chartData.deaths
    };

    region.data.uruguay.color = "#72a5d5";
    region.data.argentina.color = "#0338a8";
    region.data.brazil.color = "#fee103";
    region.data.chile.color = "#cf291d";
    region.data.paraguay.color = "#029a3a";

    var countries = Object.keys(region.data);
    var activeCasesDatasets = [];
    var casesDatasets = [];
    var deathsDatasets = [];
    for (var i = 0; i < countries.length; ++i) {
        var countryName = countries[i];
        var country = region.data[countryName];
        var populationFactor = 1000000 / population[countryName];

        activeCasesDatasets.push({
            pointRadius: 0,
            pointHoverRadius: 2,
            borderWidth: 2,
            pointBackgroundColor: country.color,
            borderColor: country.color,
            label: lang[countryName].other,
            fill: false,
            data: country.cases.slice(0, regionDays).map((el, index) => Math.round((el - country.recovered[index] - country.deaths[index]) * populationFactor)),
        });

        casesDatasets.push({
            pointRadius: 0,
            pointHoverRadius: 2,
            borderWidth: 2,
            pointBackgroundColor: country.color,
            borderColor: country.color,
            label: lang[countryName].other,
            fill: false,
            data: country.cases.slice(0, regionDays).map(el => Math.round(el * populationFactor)),
        });

        deathsDatasets.push({
            pointRadius: 0,
            pointHoverRadius: 2,
            borderWidth: 2,
            pointBackgroundColor: country.color,
            borderColor: country.color,
            label: lang[countryName].other,
            fill: false,
            data: country.deaths.slice(0, regionDays).map(el => Math.round(el * populationFactor)),
        });
    }

    var regionChartsOptions = createDefaultChartOptions();
    regionChartsOptions.legend = {
        labels: {
            usePointStyle: true
        }
    };

    var ctx = document.getElementById('chart-region-active-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: activeCasesDatasets
            },
            options: regionChartsOptions
        });
    }

    ctx = document.getElementById('chart-region-cases');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: casesDatasets
            },
            options: regionChartsOptions
        });
    }

    ctx = document.getElementById('chart-region-deaths');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.dates,
                datasets: deathsDatasets
            },
            options: regionChartsOptions
        });
    }

}

export default chart;