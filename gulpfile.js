'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const exec = require('child_process').exec;
const purgecss = require('gulp-purgecss');
const replace = require('gulp-replace');
const fs = require('fs');
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const autoprefixer = require('gulp-autoprefixer');
const { promisify } = require('util');
const csv = require('csv-parser');
const querystring = require('querystring');
const xml2json = require('xml2json');
const DATA_DIR = "./assets/js/data/"
const uruguay = require(DATA_DIR + "uruguay.json");
const VAC_BASE_URL = "https://monitor.uruguaysevacuna.gub.uy/plugin/cda/api/doQuery";

const writeFilePromise = promisify(fs.writeFile);

const nodeModules = './node_modules';

const paths = {
    mainSCSS: './assets/sass/main.scss',
    srcSCSS: './assets/sass/**/*.scss',
    destCSS: './static/css',
    deploy: 'public'
};

function sassBuild() {
    return gulp.src(paths.mainSCSS)
        .pipe(sass({ outputStyle: 'compressed', includePaths: [nodeModules] }).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(gulp.dest(paths.destCSS));
};

function sassWatch() {
    return gulp.watch(paths.srcSCSS, sassBuild);
};

const build = sassBuild;

function hugoBuild(cb) {
    const params = ["--gc", "--verbose", "--cleanDestinationDir"];
    const context = process.env.CONTEXT;
    let baseURL = process.env.URL;
    let environment = "production";

    if (context == "branch-deploy" || context == "deploy-preview") {
        baseURL = process.env.DEPLOY_PRIME_URL;
        environment = "development";
    }

    params.push("--environment");
    params.push(environment);

    if (baseURL != null) {
        params.push("--baseURL");
        params.push(baseURL);
        console.log("overriding baseURL with: " + baseURL);
    }

    exec('hugo ' + params.join(' '), function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });

};

function purgeCSS() {
    return gulp
        .src(paths.deploy + '/css/*.css')
        .pipe(
            purgecss({
                content: [paths.deploy + '/**/*.html', paths.deploy + '/**/*.js']
            })
        )
        .pipe(gulp.dest(paths.deploy + '/css'))
};

function embedCritialCSS() {
    return gulp.src(paths.deploy + '/**/*.html')
        .pipe(replace(/<link href='\/css\/main.css'[^>]*>/g, function (s) {
            const style = fs.readFileSync(paths.deploy + '/css/main.css', 'utf8');
            return '<style>\n' + style + '\n</style>';
        }))
        .pipe(gulp.dest(paths.deploy));
};

function hugoServer(cb) {
    const hugoProc = exec('hugo server --templateMetrics --disableFastRender --i18n-warnings --noHTTPCache --forceSyncStatic --gc');
    hugoProc.stdout.pipe(process.stdout);
    hugoProc.stderr.pipe(process.stderr);
    cb();
};

var updatedDate = null;

async function downloadData() {
    let response;
    try {
        response = await axios.get("https://www.worldometers.info/coronavirus/");
        if (response.status !== 200) {
            throw new Error('Unexpected HTTP code when downloading world data: ' + response.status);
        }
    }
    catch (err) {
        throw err;
    }
    const result = {};
    const html = cheerio.load(response.data);
    html(".maincounter-number").filter((i, el) => {
        let count = el.children[0].next.children[0].data || "0";
        count = parseInt(count.replace(/,/g, "") || "0", 10);
        if (i === 0) {
            result.cases = count;
        } else if (i === 1) {
            result.deaths = count;
        } else {
            result.recovered = count;
        }
    });
    updatedDate = result.updated = Math.floor(Date.now() / 1000);
    await writeFilePromise(DATA_DIR + "world.json", JSON.stringify(result));
}

async function downloadPopulationData() {
    let response;
    try {
        response = await axios.get("https://www.worldometers.info/world-population/population-by-country/");
        if (response.status !== 200) {
            throw new Error('Unexpected HTTP code when downloading world data: ' + response.status);
        }
    }
    catch (err) {
        throw err;
    }
    const result = {};
    const html = cheerio.load(response.data);
    html("table tbody tr").each((i, el) => {
        const country = el.children[3].children[0].children[0].data.toLowerCase();
        if (country === 'uruguay' || Object.keys(Countries).indexOf(country) != -1) {
            const population = parseInt(el.children[5].children[0].data.replace(/,/g, ""));
            result[country] = population;
        }
    });
    await writeFilePromise(DATA_DIR + "world-population.json", JSON.stringify(result));
}

const watch = sassWatch;

function updateLastMod() {
    return gulp.src('content/_index*.md')
        .pipe(replace(/^lastmod.*/m, function () {
            if (updatedDate == null) {
                updatedDate = Date.now() / 1000;
            }
            return 'lastmod: ' + moment(updatedDate * 1000).format("YYYY-MM-DDTHH:mm:ssZZ");
        }))
        .pipe(gulp.dest('content'));
}

const Countries = {
    argentina: { cases: [], recovered: [], deaths: [] },
    brazil: { cases: [], recovered: [], deaths: [] },
    chile: { cases: [], recovered: [], deaths: [] },
    paraguay: { cases: [], recovered: [], deaths: [] }
};

const COUNTRIES_DATA_BASE_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/';
const REFERENCE_DATE = moment(uruguay.data[0].date, "YYYY-MM-DD");
let lastDate = null;
let firstDate = null;

async function downloadCountryData(file, property) {
    var req = {
        method: 'get',
        url: COUNTRIES_DATA_BASE_URL + file,
        responseType: 'stream'
    }

    const res = await axios(req);
    const stream = res.data.pipe(csv());
    stream.on('data', data => {
        const dataCountryName = data['Country/Region'];
        const countryName = typeof dataCountryName == "string" ? dataCountryName.toLowerCase() : null;
        if (countryName) {
            const country = Countries[countryName];
            if (country) {
                const keys = Object.keys(data);
                for (let i = 0; i < keys.length; ++i) {
                    const key = keys[i];
                    const dataDate = moment(key, "MM/DD/YY");
                    if (dataDate.isValid() && dataDate >= REFERENCE_DATE) {
                        if (firstDate == null) {
                            firstDate = dataDate;
                        }
                        if (i == keys.length - 1) {
                            if (lastDate == null) {
                                lastDate = dataDate;
                            }
                            else if (dataDate.unix() != lastDate.unix()) {
                                throw new Error("Unexpected last date: " + dataDate + ", prev one: " + lastDate);
                            }
                        }
                        const value = parseInt(data[key]);
                        country[property].push(value);
                    }
                }
            }
        }
    });

    return new Promise((resolve, reject) => {
        stream.on("error", reject);
        stream.on("end", resolve);
    });
}

async function downloadCountriesData() {
    await Promise.all([
        downloadCountryData('time_series_covid19_confirmed_global.csv', 'cases'),
        downloadCountryData('time_series_covid19_recovered_global.csv', 'recovered'),
        downloadCountryData('time_series_covid19_deaths_global.csv', 'deaths')
    ]);

    var regionObj = {
        firstDate: firstDate.format("YYYY-MM-DD"),
        lastDate: lastDate.format("YYYY-MM-DD"),
        data: Countries
    }

    return writeFilePromise(DATA_DIR + "region.json", JSON.stringify(regionObj));
}

async function request(url, params) {
    url += "?" + querystring.encode(params);

    try {
        let response;
        response = await axios.get(url)
        if (response.status !== 200) {
            throw new Error('Unexpected HTTP code when downloading data: ' + response.status);
        }
        return response.data;
    } catch (e) {
        throw e;
    }
}

async function getVacHistoryData() {
    const params = {
        path: "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda",
        dataAccessId: "sql_evolucion",
        outputIndexId: "1",
        pageSize: "0",
        pageStart: "0",
        sortBy: "",
        paramsearchBox: "",
        outputType: "XML"
    }
    return await request(VAC_BASE_URL, params);
}

const today = moment();

async function getVacTotalData() {
    const params = {
        paramp_periodo_desde_sk: "20210227",
        paramp_periodo_hasta_sk: today.format("YYYYMMDD"),
        path: "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda",
        dataAccessId: "sql_indicadores_generales",
        outputIndexId: "1",
        pageSize: "0",
        pageStart: "0",
        sortBy: "",
        paramsearchBox: "",
        outputType: "XML"
    }
    return await request(VAC_BASE_URL, params);
}

async function getVacTypeData() {
    const params = {
        paramp_periodo_desde_sk: "20210227",
        paramp_periodo_hasta_sk: today.format("YYYYMMDD"),
        path: "/public/Epidemiologia/Vacunas Covid/Paneles/Vacunas Covid/VacunasCovid.cda",
        dataAccessId: "sql_vacunas_tipo_vacuna",
        outputIndexId: "1",
        pageSize: "0",
        pageStart: "0",
        sortBy: "",
        paramsearchBox: "",
        outputType: "XML"
    }
    return await request(VAC_BASE_URL, params);
}

async function downloadUruguayVaccinationData() {
    const [vacHistoryData, vacTotalData, vacTypeData] = await Promise.all([getVacHistoryData(), getVacTotalData(), getVacTypeData()]);

    const vacHistoryDataObj = xml2json.toJson(vacHistoryData, { object: true });
    const vacHistoryMetadata = vacHistoryDataObj.CdaExport.MetaData.ColumnMetaData;

    let dateIndex = -1, totalIndex = -1, coronavacIndex = -1, pfizerIndex = -1;
    for (let i = 0; i < vacHistoryMetadata.length; ++i) {
        const metadataCol = vacHistoryMetadata[i];
        const name = metadataCol.name.toLowerCase();

        if (name.includes("fecha")) {
            dateIndex = parseInt(metadataCol.index);
        }
        else if (name.includes("actos vacunales")) {
            totalIndex = parseInt(metadataCol.index);
        }
        else if (name.includes("coronavac")) {
            coronavacIndex = parseInt(metadataCol.index);
        }
        else if (name.includes("pfizer")) {
            pfizerIndex = parseInt(metadataCol.index);
        }
    }

    if (dateIndex == -1 || totalIndex == -1 || coronavacIndex == -1 || pfizerIndex == -1) {
        throw new Error("Can't find vac data indexes");
    }

    const vacData = {
        history: {
            date : [],
            total : [],
            coronavac: [],
            pfizer: []
        }
    }

    const rows = vacHistoryDataObj.CdaExport.ResultSet.Row;
    for (let i = 0; i < rows.length; ++i) {
        const data = rows[i].Col;

        const date = data[dateIndex].replace("-", "/");
        let total = data[totalIndex];
        let coronavac = data[coronavacIndex];
        if (coronavac == null || (typeof coronavac === "object" && coronavac.isNull === "true")) {
            coronavac = 0;
        }
        let pfizer = data[pfizerIndex];
        if (pfizer == null || (typeof pfizer === "object" && pfizer.isNull === "true")) {
            pfizer = 0;
        }

        total = parseInt(total);
        coronavac = parseInt(coronavac);
        pfizer = parseInt(pfizer);

        vacData.history.date.push(date);
        vacData.history.total.push(total);
        vacData.history.coronavac.push(coronavac);
        vacData.history.pfizer.push(pfizer);
    }

    ///////////

    const vacTotalsDataObj = xml2json.toJson(vacTotalData, { object: true });
    const vacTotalsMetadata = vacTotalsDataObj.CdaExport.MetaData.ColumnMetaData;

    let todayDateIndex = -1, totalVacIndex = -1, todayTotalIndex = -1;
    for (let i = 0; i < vacTotalsMetadata.length; ++i) {
        const metadataCol = vacTotalsMetadata[i];
        const name = metadataCol.name.toLowerCase();

        if (name.includes("hora")) {
            todayDateIndex = parseInt(metadataCol.index);
        }
        else if (name.includes("vacunaciones")) {
            totalVacIndex = parseInt(metadataCol.index);
        }
        else if (name.includes("actoshoy")) {
            todayTotalIndex = parseInt(metadataCol.index);
        }
    }

    if (todayDateIndex == -1 || totalVacIndex == -1 || todayTotalIndex == -1) {
        throw new Error("Can't find vac total data indexes");
    }

    const totalRows = vacTotalsDataObj.CdaExport.ResultSet.Row;
    const totalsData = totalRows.Col;

    const todayDate = totalsData[todayDateIndex];
    const todayTotal = totalsData[todayTotalIndex];
    const totalVac = totalsData[totalVacIndex];

    vacData.date = today.format("YYYY-MM-DD");
    vacData.todayDate = todayDate;
    vacData.todayTotal = parseInt(todayTotal);
    vacData.total = parseInt(totalVac);

    ///////

    const vacTypeDataObj = xml2json.toJson(vacTypeData, { object: true });
    const vacTypeRows = vacTypeDataObj.CdaExport.ResultSet.Row;
    let coronavacTotal = -1;
    let pfizerTotal = -1;
    for (let i = 0; i < vacTypeRows.length; ++i) {
        const col = vacTypeRows[i].Col;
        if(col[0].toLowerCase().includes("coronavac")) {
            coronavacTotal = parseInt(col[1]);
        }
        else if(col[0].toLowerCase().includes("pfizer")) {
            pfizerTotal = parseInt(col[1]);
        }
    }

    if(coronavacTotal == -1 || pfizerTotal == -1) {
        throw new Error("Can't find Coronavac or Pfizer totals");
    }

    vacData.coronavacTotal = coronavacTotal;
    vacData.pfizerTotal = pfizerTotal;

    await writeFilePromise(DATA_DIR + "uruguayVaccination.json", JSON.stringify(vacData));

}


exports.develop = gulp.series(gulp.parallel(downloadData, downloadCountriesData, downloadPopulationData, downloadUruguayVaccinationData), build, gulp.parallel(watch, hugoServer));
exports.deploy = gulp.series(gulp.parallel(downloadData, downloadCountriesData, downloadPopulationData, downloadUruguayVaccinationData), updateLastMod, build, hugoBuild, purgeCSS, embedCritialCSS);
exports.default = exports.develop;
