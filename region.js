const axios = require("axios");
const moment = require("moment");
const csv = require('csv-parser');

var Country = {
    dates: [], cases: [], recovered: [], deaths: []
}

const Countries = {
    Argentina: Object.create(Country),
    Brazil: Object.create(Country),
    Chile: Object.create(Country),
    Paraguay: Object.create(Country)
};

const BASE_URL = 'https://github.com/CSSEGISandData/COVID-19/raw/master/csse_covid_19_data/csse_covid_19_time_series/';

function downloadData(file, property, addDates) {
    var req = {
        method: 'get',
        url: BASE_URL + file,
        responseType: 'stream'
    }

    axios(req).then(res => {
        res.data.pipe((csv()).on('data', (data) => {
            const countryName = data['Country/Region'];
            const country = Countries[countryName];
            if (country) {
                const keys = Object.keys(data);
                for (let i = 0; i < keys.length; ++i) {
                    const key = keys[i];
                    const dataDate = moment(key, "MM/DD/YY");
                    if (dataDate.isValid()) {
                        const value = data[key];
                        const date = dataDate.format("YYYY-MM-DD");
                        if(addDates) {
                            country.dates.push(date);
                        }
                        country[property].push(value);
                    }
                }
            }
        }));
    }).catch(err => console.log(err));
}

downloadData('time_series_covid19_confirmed_global.csv', 'cases', true);
downloadData('time_series_covid19_recovered_global.csv', 'recovered', false);
downloadData('time_series_covid19_deaths_global.csv', 'deaths', false);

