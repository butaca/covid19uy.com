'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const exec = require('child_process').exec;
const purgecss = require('gulp-purgecss');
const replace = require('gulp-replace');
const fs = require('fs');
const axios = require("axios");
axios.default.defaults.timeout = 60000;
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
const VIS_BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/Casos_DepartamentosROU_vista_2/FeatureServer/";
const VIS_ICU_BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/OcupacionUY_vista/FeatureServer/";
const { buildChartData, watchChartData } = require('./gulp/buildChartData');

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
    await writeFilePromise(DATA_DIR + "worldPopulation.json", JSON.stringify(result));
}

const watch = gulp.parallel(sassWatch, watchChartData);

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
            return Promise.reject(new Error('Unexpected HTTP code when downloading data: ' + response.status));
        }
        return response.data;
    } catch (e) {
        return Promise.reject(e);
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
    let vacDataFailed = false;

    const vacData = {
        history: {
            date: [],
            total: [],
            coronavac: [],
            pfizer: [],
            astrazeneca: []
        },
        date: today.format("YYYY-MM-DD"),
        todayDate: "",
        todayTotal: 0,
        total: 0,
        firstDoseTotal: 0,
        secondDoseTotal: 0,
        coronavacTotal: 0,
        astrazenecaTotal: 0,
        pfizerTotal: 0,
        goal: 2800000
    }

    try {
        const [vacHistoryData, vacTotalData, vacTypeData] = await Promise.allSettled([getVacHistoryData(), getVacTotalData(), getVacTypeData()]);

        if (vacHistoryData.status === "fulfilled") {
            const vacHistoryDataObj = xml2json.toJson(vacHistoryData.value, { object: true });
            const vacHistoryMetadata = vacHistoryDataObj.CdaExport.MetaData.ColumnMetaData;

            let dateIndex = -1, totalIndex = -1, coronavacIndex = -1, pfizerIndex = -1, astrazenecaIndex = -1;
            for (let i = 0; i < vacHistoryMetadata.length; ++i) {
                const metadataCol = vacHistoryMetadata[i];
                const name = metadataCol.name.toLowerCase();

                if (name.includes("fecha")) {
                    dateIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("actos vacunales")) {
                    totalIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("sinovac")) {
                    coronavacIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("pfizer")) {
                    pfizerIndex = parseInt(metadataCol.index);
                }
                else if(name.includes("astrazeneca")) {
                    astrazenecaIndex = parseInt(metadataCol.index);
                }
            }

            //TODO: add astrazeneca when available
            if (dateIndex == -1 || totalIndex == -1 || coronavacIndex == -1 || pfizerIndex == -1) {
                throw new Error("Can't find vac data indexes");
            }

            const rows = vacHistoryDataObj.CdaExport.ResultSet.Row;
            let lastDate = null;
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

                let astrazeneca = 0;
                if(astrazenecaIndex != -1) {
                    let astrazeneca = data[astrazenecaIndex];
                    if (astrazeneca == null || (typeof astrazeneca === "object" && astrazeneca.isNull === "true")) {
                        astrazeneca = 0;
                    }
                } 

                total = parseInt(total);
                coronavac = parseInt(coronavac);
                pfizer = parseInt(pfizer);
                astrazeneca = parseInt(astrazeneca);

                vacData.history.date.push(date);
                vacData.history.total.push(total);
                vacData.history.coronavac.push(coronavac);
                vacData.history.pfizer.push(pfizer);
                vacData.history.astrazeneca.push(astrazeneca);

                lastDate = date;
            }

            if (lastDate == null) {
                vacDataFailed = true;
                console.log("Vac history inconsistent: empty");
            }
            else {
                let minRegisters = 32;

                if (vacData.history.date.length < minRegisters) {
                    vacDataFailed = true;
                    console.log("Vac history inconsistent: got " + vacData.history.date.length + " registers, at least " + minRegisters + " required");
                }
            }

        }
        else {
            console.log("Error getting vac history: " + vacHistoryData.reason);
            vacDataFailed = true;
        }

        ///////////

        if (vacTotalData.status === "fulfilled") {
            const vacTotalsDataObj = xml2json.toJson(vacTotalData.value, { object: true });
            const vacTotalsMetadata = vacTotalsDataObj.CdaExport.MetaData.ColumnMetaData;

            let todayDateIndex = -1, totalVacIndex = -1, todayTotalIndex = -1, firstDoseIndex = -1, secondDoseIndex = -1;
            for (let i = 0; i < vacTotalsMetadata.length; ++i) {
                const metadataCol = vacTotalsMetadata[i];
                const name = metadataCol.name.toLowerCase();

                if (name.includes("hora")) {
                    todayDateIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("dosis pais")) {
                    totalVacIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("actoshoy")) {
                    todayTotalIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("per1")) {
                    firstDoseIndex = parseInt(metadataCol.index);
                }
                else if (name.includes("per2")) {
                    secondDoseIndex = parseInt(metadataCol.index);
                }
            }

            if (todayDateIndex == -1 || totalVacIndex == -1 || todayTotalIndex == -1 || firstDoseIndex == -1 || secondDoseIndex == -1) {
                throw new Error("Can't find vac total data indexes");
            }

            const totalRows = vacTotalsDataObj.CdaExport.ResultSet.Row;
            const totalsData = totalRows.Col;

            const todayDate = totalsData[todayDateIndex];
            const todayTotal = totalsData[todayTotalIndex];
            const totalVac = totalsData[totalVacIndex];
            const firstDoseTotal = totalsData[firstDoseIndex];
            const secondDoseTotal = totalsData[secondDoseIndex];

            vacData.date = today.format("YYYY-MM-DD");
            vacData.todayDate = todayDate;
            vacData.todayTotal = parseInt(todayTotal);
            vacData.firstDoseTotal = parseInt(firstDoseTotal);
            vacData.secondDoseTotal = parseInt(secondDoseTotal);
            const dataTotalVac = parseInt(totalVac);
            vacData.total = Math.max(dataTotalVac, vacData.firstDoseTotal + vacData.secondDoseTotal);

            if (dataTotalVac <= 0) {
                console.log("Vac total inconsistent: <= 0");
                vacDataFailed = true;
            }
        }
        else {
            console.log("Error getting vac total: " + vacTotalData.reason);
            vacDataFailed = true;
        }

        ///////

        if (vacTypeData.status === "fulfilled") {
            const vacTypeDataObj = xml2json.toJson(vacTypeData.value, { object: true });
            const vacTypeRows = vacTypeDataObj.CdaExport.ResultSet.Row;
            let coronavacTotal = 0;
            let pfizerTotal = 0;
            let astrazenecaTotal = 0;
            for (let i = 0; i < vacTypeRows.length; ++i) {
                const col = vacTypeRows[i].Col;
                const name = col[0];
                const value = col[1];
                if (name.toLowerCase().includes("coronavac")) {
                    coronavacTotal = parseInt(value);
                }
                else if (name.toLowerCase().includes("pfizer")) {
                    pfizerTotal = parseInt(value);
                }
                else if(name.toLowerCase().includes("astrazeneca")) {
                    astrazenecaTotal = parseInt(value);
                }
            }

            vacData.coronavacTotal = coronavacTotal;
            vacData.pfizerTotal = pfizerTotal;
            vacData.astrazenecaTotal = astrazenecaTotal;
            if (vacData.total == 0) {
                vacData.total = coronavacTotal + pfizerTotal + astrazenecaTotal;
            }

            //TODO: add AstraZeneca vac when available
            if (coronavacTotal == 0 || pfizerTotal == 0) {
                console.log("Vac type inconsistent: Sinovac or Pfizer == 0");
                vacDataFailed = true;
            }
        }
        else {
            console.log("Error getting vac type: " + vacTypeData.reason);
            vacDataFailed = true;
        }

    } catch (e) {
        console.log("Error getting vaccination data. " + e.name + ": " + e.message);
        vacDataFailed = true;
    }

    const vacDataFile = DATA_DIR + "uruguayVaccination.json";

    if (!vacDataFailed || !fs.existsSync(vacDataFile)) {
        await writeFilePromise(vacDataFile, JSON.stringify(vacData));
    }
}

async function getDepartmentsData() {
    const params = {
        f: "json",
        where: "CasosActivos>=0",
        returnGeometry: "false",
        outFields: "*",
        orderByFields: "CasosActivos desc",
        resultOffset: "0",
        resultRecordCount: "19",
        resultType: "standard",
        cacheHint: "false"
    }

    return await request(VIS_BASE_URL + "/0/query", params);
}

async function getVisUpdatedDate() {
    const data = await request(VIS_BASE_URL + '0/', { f: "json" });
    return moment(data.editingInfo.lastEditDate).format("YYYY-MM-DD");
}

async function downloadDepartmentsData() {
    const data = {
        departments: {}
    };

    const [date, respData] = await Promise.all([getVisUpdatedDate(), getDepartmentsData()]);

    data.date = date;

    for (let i = 0; i < respData.features.length; ++i) {
        const attributes = respData.features[i].attributes;
        data.departments[attributes.NOMBRE] = attributes.CasosActivos;
    }

    await writeFilePromise(DATA_DIR + "uruguayDepartments.json", JSON.stringify(data));
}

async function getICUData() {
    const params = {
        f: "json",
        where: "1=1",
        returnGeometry: "false",
        outFields: "*",
        resultOffset: "0",
        resultRecordCount: "1",
        resultType: "standard",
        cacheHint: "false"
    }

    return await request(VIS_ICU_BASE_URL + "/0/query", params);
}

async function downloadICUData() {
    const icuData = await getICUData();
    const icu = icuData.features[0].attributes;
    const data = {
        beds: {
            total: icu.cam_dotacion,
            blocked: icu.cam_bloq,
            available: icu.cam_hab,
            free: icu.cam_libres,
            expansionPotential: icu.cam_amp,
            freeRespiratoryIsolation: icu.cam_libres_ais_resp,
        },
        occupation: {
            total: icu.cam_ocu_tot,
            covid19: icu.cam_ocu_covid19,
            irag: icu.cam_ocu_rag,
            other: icu.cam_ocu_otro,
        },
        lastEditedDate: icu.last_edited_date
    };

    await writeFilePromise(DATA_DIR + "icu.json", JSON.stringify(data));
}

exports.downloadVacData = downloadUruguayVaccinationData;
exports.buildChartData = buildChartData;
exports.develop = gulp.series(gulp.parallel(downloadData, downloadCountriesData, downloadPopulationData, downloadUruguayVaccinationData, downloadDepartmentsData, downloadICUData, buildChartData), build, gulp.parallel(watch, hugoServer));
exports.deploy = gulp.series(gulp.parallel(downloadData, downloadCountriesData, downloadPopulationData, downloadUruguayVaccinationData, downloadDepartmentsData, downloadICUData, buildChartData), updateLastMod, build, hugoBuild, purgeCSS, embedCritialCSS);
exports.default = exports.develop;

