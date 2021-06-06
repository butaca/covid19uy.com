import { createDefaultChartOptions, pieToolTips } from './util'
import vaccinationData from "../data/uruguayVaccination.json"

const COLOR_SINOVAC = "#0000ff80";
const COLOR_PFIZER = "#ffa500";
const COLOR_ASTRAZENECA = "#48c774";
const COLOR_TOTAL = "#28b8d680";

function chart(_chartData, lang) {

    const vacDate = new Date(vaccinationData.date);

    const htmlLang = document.documentElement.getAttribute("lang");
    const vacDateStr = vacDate.toLocaleString(htmlLang).replace(/\:00(?=[^:00]*$)/, '');

    const flipDate = htmlLang == "en";

    const vacDates = vaccinationData.history.date.map(function (el) {
        const s = el.split("-");
        if (flipDate) {
            return s[1] + "/" + s[2];
        } else {
            return s[2] + "/" + s[1];
        }
    });

    const totalVacs = vaccinationData.coronavacTotal + vaccinationData.pfizerTotal + vaccinationData.astrazenecaTotal;

    let ctx = document.getElementById('chart-daily-vacs');

    if (ctx) {
        const options = createDefaultChartOptions();
        let dateElem = ctx.parentElement.querySelector(".date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDateStr;
        }
        const historyDatasets = [
            {
                pointBackgroundColor: COLOR_TOTAL,
                backgroundColor: COLOR_TOTAL,
                label: lang.vacTotal.other,
                data: vaccinationData.history.total,
            },
            {
                pointBackgroundColor: COLOR_SINOVAC,
                backgroundColor: COLOR_SINOVAC,
                label: lang.vacCoronavac.other,
                data: vaccinationData.history.coronavac,
                hidden: true,
            },
            {
                pointBackgroundColor: COLOR_PFIZER,
                backgroundColor: COLOR_PFIZER,
                label: lang.vacPfizer.other,
                data: vaccinationData.history.pfizer,
                hidden: true,
            },
            {
                pointBackgroundColor: COLOR_ASTRAZENECA,
                backgroundColor: COLOR_ASTRAZENECA,
                label: lang.vacAstrazeneca.other,
                data: vaccinationData.history.astrazeneca,
                hidden: true,
            }
        ];

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: vacDates,
                datasets: historyDatasets
            },
            options: options
        });
    }

    ctx = document.getElementById('chart-total-vacs');
    if (ctx) {
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
            /*
            center: {
                text: (totalVacs > 0) ? (lang.vacTotal.other + ': ' + totalVacs.toLocaleString(htmlLang)) : lang.notAvailable.other,
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
            */
        };
        options.tooltips = pieToolTips;

        dateElem = ctx.parentElement.querySelector(".date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDateStr;
        }

        const vacTotalData = [vaccinationData.coronavacTotal, vaccinationData.pfizerTotal, vaccinationData.astrazenecaTotal];
        let vacTotalLabels = [lang.vacCoronavac.other, lang.vacPfizer.other, lang.vacAstrazeneca.other];
        vacTotalLabels = vacTotalLabels.map(function (label, index) { return label + ': ' + (vacTotalData[index] / totalVacs * 100).toFixed(2) + '%' });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: vacTotalLabels,
                datasets: [{
                    data: vacTotalData,
                    backgroundColor: [COLOR_SINOVAC, COLOR_PFIZER, COLOR_ASTRAZENECA]
                }]
            },
            options: options
        });
    }

    ctx = document.getElementById('chart-daily-dose');

    function getDailyTotals(dailyValues) {
        const dailyTotals = [];
        let total = 0;
        for(let i = 0; i < dailyValues.length; ++i) {
            total += dailyValues[i];
            dailyTotals.push(total);
        }
        return dailyTotals;
    }

    const firstDoseTotal = getDailyTotals(vaccinationData.history.firstDose);
    const secondDoseTotal = getDailyTotals(vaccinationData.history.secondDose);

    if (ctx) {
        const options = createDefaultChartOptions();
        let dateElem = ctx.parentElement.querySelector(".date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDateStr;
        }

        const doseHistoryDatasets = [
            {
                pointBackgroundColor: "#77ed77ff",
                backgroundColor: "#77ed77ff",
                label: lang.secondDose.other,
                data: secondDoseTotal,
            },
            {
                pointBackgroundColor: "#d0eed0ff",
                backgroundColor: "#d0eed0ff",
                label: lang.firstDose.other,
                data: firstDoseTotal,
            }
        ];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: vacDates,
                datasets: doseHistoryDatasets
            },
            options: options
        });
    }
}

export default chart;