const MOVING_AVERAGE_DELTA = 3;
const pointRadius = 2;
const pointHoverRadius = 3;

function getTotal(values) {
    return values.reduce(function (prev, cur) { return prev + cur });
}

function createDefaultChartOptions() {
    return {
        animation: {
            duration: 0
        },
        legend: {
            labels: {
                filter: function (item) {
                    return !item.text.includes("AVG");
                }
            }
        }
    };
}

function createMovingAverageDataset(data, length, color) {
    return {
        type: "line",
        fill: false,
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        borderColor: color,
        data: movingAverage(data, length, length),
        label: "AVG",
    };
}

function average(array, startIndex, length, prevAverage) {
    if (prevAverage == null || prevAverage == undefined) {
        var sum = 0;
        for (var i = 0; i < length && (i + startIndex) < array.length; ++i) {
            sum += array[i + startIndex];
        }
        return sum / length;
    }
    else {
        return prevAverage + (-array[startIndex - 1] + array[startIndex + length - 1]) / length;
    }
}

function movingAverage(array, prev, next) {
    var results = [];
    for (var i = 0; i < prev; ++i) {
        results.push(null);
    }
    var prevAverage = null;
    for (var i = prev; i < (array.length - next); ++i) {
        var avg = average(array, i - prev, prev + next + 1, prevAverage);
        results.push(round(avg, 2));
        prevAverage = avg;
    }
    for (var i = 0; i < next; ++i) {
        results.push(null);
    }
    return results;
}

function round(number, decimalPlaces) {
    const factorOfTen = Math.pow(10, decimalPlaces)
    return Math.round(number * factorOfTen) / factorOfTen
}

var pieToolTips = {
    callbacks: {
        title: function (tooltipItem, data) {
            return data['labels'][tooltipItem[0]['index']];
        },
        label: function (tooltipItem, data) {
            return data['datasets'][0]['data'][tooltipItem['index']];
        }
    }
};

export { getTotal, createDefaultChartOptions, createMovingAverageDataset, MOVING_AVERAGE_DELTA, pointRadius, pointHoverRadius, pieToolTips };