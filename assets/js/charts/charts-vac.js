import { createDefaultChartOptions, pieToolTips } from './util'
import vaccinationData from "../data/uruguayVaccination.json"

function getSiblingWithClass(elem, clazz) {
    const siblings = Array.prototype.filter.call(elem.parentNode.children, function (child) {
        return child !== elem && child.classList.contains(clazz);
    });
    if (siblings.length > 0) {
        return siblings[0];
    }
    return null;
}

function chart(_chartData, lang) {
    const utcDate = new Date(vaccinationData.date)
    const vacDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    const vacDateTokens = vaccinationData.todayDate.split(':');
    if (vacDateTokens.length >= 2) {
        vacDate.setHours(vacDateTokens[0]);
        vacDate.setMinutes(vacDateTokens[1]);
    }

    const htmlLang = document.documentElement.getAttribute("lang");
    const flipDate = htmlLang == "en";

    const vacDates = vaccinationData.history.date.map(function (el) {
        if (flipDate) {
            var s = el.split("/");
            return s[1] + "/" + s[0];
        } else {
            return el;
        }
    });

    const totalVacs = vaccinationData.coronavacTotal + vaccinationData.pfizerTotal;

    let ctx = document.getElementById('chart-daily-vacs');

    if (ctx) {
        const options = createDefaultChartOptions();
        let dateElem = getSiblingWithClass(ctx, "date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDate.toLocaleString(htmlLang);
        }
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: vacDates,
                datasets: [
                    {
                        pointBackgroundColor: "#0000FFFF",
                        backgroundColor: "#0000FF80",
                        label: lang.vacTotal.other,
                        data: vaccinationData.history.total,
                    },
                    {
                        pointBackgroundColor: "#FF8C00ff",
                        backgroundColor: "#FF8C0080",
                        label: lang.vacCoronavac.other,
                        data: vaccinationData.history.coronavac,
                    },
                    {
                        pointBackgroundColor: "#00CC00FF",
                        backgroundColor: "#00CC0080",
                        label: lang.vacPfizer.other,
                        data: vaccinationData.history.pfizer,
                    }
                ]
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
            center: {
                text: (totalVacs > 0) ? (lang.vacTotal.other + ': ' + totalVacs.toLocaleString(htmlLang)) : lang.notAvailable.other,
                color: '#36A2EB',
                fontStyle: 'Helvetica',
                sidePadding: 15
            }
        };
        options.tooltips = pieToolTips;

        dateElem = getSiblingWithClass(ctx, "date");
        if (dateElem != null) {
            dateElem.innerHTML = lang.updated.other + ": " + vacDate.toLocaleString(htmlLang);
        }


        const vacTotalData = [vaccinationData.coronavacTotal, vaccinationData.pfizerTotal];
        let vacTotalLabels = [lang.vacCoronavac.other, lang.vacPfizer.other];
        vacTotalLabels = vacTotalLabels.map(function (label, index) { return label + ': ' + (vacTotalData[index] / totalVacs * 100).toFixed(2) + '%' });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: vacTotalLabels,
                datasets: [{
                    data: vacTotalData,
                    backgroundColor: ["#FF8C0080", "#00CC0080"]
                }]
            },
            options: options
        });
    }
}

export default chart;