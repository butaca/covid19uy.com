import { createDefaultChartOptions } from './util'

function round(number, decimalPlaces) {
    const factorOfTen = Math.pow(10, decimalPlaces)
    return Math.round(number * factorOfTen) / factorOfTen
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpColor(a, b, t) {
    return {
        r: Math.round(lerp(a.r, b.r, t)),
        g: Math.round(lerp(a.g, b.g, t)),
        b: Math.round(lerp(a.b, b.b, t))
    }
}

function RGBToHex(c) {
    let r = c.r.toString(16);
    let g = c.g.toString(16);
    let b = c.b.toString(16);

    if (r.length == 1) {
        r = "0" + r;
    }
    if (g.length == 1) {
        g = "0" + g;
    }
    if (b.length == 1) {
        b = "0" + b;
    }

    return "#" + r + g + b;
}

const HARVARD_COLOR_LIMIT = 25;

function chart(chartData, lang) {
    const datesWithWeeklyData = [];
    datesWithWeeklyData.push(...chartData.dates);
    datesWithWeeklyData.push(...chartData.datesWeeklyData);

    const fullDatesWithWeeklyData = [];
    fullDatesWithWeeklyData.push(...chartData.fullDates);
    fullDatesWithWeeklyData.push(...chartData.fullDatesWeeklyData);

    const startColor = {
        r: 240,
        g: 248,
        b: 255
    }
    const endColor = {
        r: 0,
        g: 0,
        b: 139
    }
    const harvardColors = [];

    for (let i = 1; i <= HARVARD_COLOR_LIMIT; ++i) {
        harvardColors.push(RGBToHex(lerpColor(startColor, endColor, i / HARVARD_COLOR_LIMIT)));
    }

    const colorChangeDate = new Date("2021-11-04").getTime();
    
    const colors = [];
    for (let i = 0; i < chartData.harvardIndexDaily.length; ++i) {
        const harvardIndex = chartData.harvardIndexDaily[i];
        const fullDate = fullDatesWithWeeklyData[i];

        let color;

        if (new Date(fullDate).getTime() >= colorChangeDate) {
            const index = Math.min(HARVARD_COLOR_LIMIT, Math.round(harvardIndex)) - 1;
            color = harvardColors[index];
        }
        else {
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
        }
        colors.push(color);
    }

    var ctx = document.getElementById('chart-harvard-index');
    if (ctx) {
        var options = createDefaultChartOptions()
        options.legend = {
            display: false
        };
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datesWithWeeklyData.slice(datesWithWeeklyData.length - chartData.harvardIndexDaily.length),
                datasets: [
                    {
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: colors,
                        label: lang.harvardIndex.other,
                        data: chartData.harvardIndexDaily.map(hi => round(hi, 2))
                    }
                ]
            },
            options: options
        });
    }
}

export default chart;