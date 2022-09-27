'use strict';

const { BASE_DATA_DIR, request, writeFileAndCache, copyFromCache, notify } = require('./gulp/util');
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const exec = require('child_process').exec;
const purgecss = require('gulp-purgecss');
const replace = require('gulp-replace');
const fs = require('fs');
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const autoprefixer = require('gulp-autoprefixer');
const csv = require('csv-parser');
const DATA_DIR = BASE_DATA_DIR;
const uruguay = require("./" + DATA_DIR + "uruguay.json");
const VIS_BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/Casos_DepartamentosROU_vista_2/FeatureServer/";
const VIS_ICU_BASE_URL = "https://services5.arcgis.com/Th0Tmkhiy5BQYoxP/arcgis/rest/services/OcupacionUY_vista/FeatureServer/";
const { buildChartData, watchChartData } = require('./gulp/buildChartData');
const { downloadUruguayVaccinationData } = require('./gulp/downloadVacData');

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
    const hugoProc = exec('hugo server --templateMetrics --disableFastRender --noHTTPCache --forceSyncStatic --gc');
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
        await writeFileAndCache(DATA_DIR, "world.json", JSON.stringify(result));
    }
    catch (e) {
        notify("Error getting world data, getting it from the cache: " + e.message)
        await copyFromCache(DATA_DIR, "world.json", null);
    }
}

async function downloadPopulationData() {
    let response;
    try {
        response = await axios.get("https://www.worldometers.info/world-population/population-by-country/");
        if (response.status !== 200) {
            throw new Error('Unexpected HTTP code when downloading world data: ' + response.status);
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
        await writeFileAndCache(DATA_DIR, "worldPopulation.json", JSON.stringify(result));
    } catch (e) {
        notify("Error getting world population data, getting it from the cache: " + e.message);
        await copyFromCache(DATA_DIR, "worldPopulation.json", null);
    }
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

const COUNTRIES_DATA_REPO_URL = "https://api.github.com/repos/CSSEGISandData/COVID-19/branches/master";
const COUNTRIES_DATA_BASE_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/{hash}/csse_covid_19_data/csse_covid_19_time_series/';
const REFERENCE_DATE = moment(uruguay.data[0].date, "YYYY-MM-DD");
let lastDate = null;
let firstDate = null;

async function downloadCountryData(file, hash, property) {
    var req = {
        method: 'get',
        url: COUNTRIES_DATA_BASE_URL.replace("{hash}", hash) + file,
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
    let hash = null;
    try {
        const repoData = await request(COUNTRIES_DATA_REPO_URL);
        hash = repoData.commit.sha;
    }
    catch(e) {
        // Github API is failing frequently with a 403 error when getting the current commit hash
        // If that's the case, try master instead
        hash = "master";
        console.log("Failed to get repo data, using master instead of current commit: " + e.message);
    }

    try {
        await Promise.all([
            downloadCountryData('time_series_covid19_confirmed_global.csv', hash, 'cases'),
            downloadCountryData('time_series_covid19_recovered_global.csv', hash, 'recovered'),
            downloadCountryData('time_series_covid19_deaths_global.csv', hash, 'deaths')
        ]);

        var regionObj = {
            firstDate: firstDate.format("YYYY-MM-DD"),
            lastDate: lastDate.format("YYYY-MM-DD"),
            data: Countries
        }

        await writeFileAndCache(DATA_DIR, "region.json", JSON.stringify(regionObj));
    } catch (e) {
        notify("Error getting region data, getting it from the cache: " + e.message);
        await copyFromCache(DATA_DIR, "region.json", null);
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
    try {
        const data = {
            departments: {}
        };

        const [date, respData] = await Promise.all([getVisUpdatedDate(), getDepartmentsData()]);

        data.date = date;

        for (let i = 0; i < respData.features.length; ++i) {
            const attributes = respData.features[i].attributes;
            data.departments[attributes.NOMBRE] = attributes.CasosActivos;
        }

        await writeFileAndCache(DATA_DIR, "uruguayDepartments.json", JSON.stringify(data));
    }
    catch (e) {
        notify("Error getting Uruguay departments data, getting it from the cache: " + e.message);
        await copyFromCache(DATA_DIR, "uruguayDepartments.json", null);
    }
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
    try {
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

        await writeFileAndCache(DATA_DIR, "icu.json", JSON.stringify(data));
    } catch (e) {
        notify("Error getting ICU data, getting it from the cache: " + e.message);
        await copyFromCache(DATA_DIR, "icu.json", null);
    }
}

exports.downloadVacData = downloadUruguayVaccinationData;
exports.buildChartData = buildChartData;
exports.develop = gulp.series(gulp.parallel(downloadData, downloadCountriesData, downloadPopulationData, downloadUruguayVaccinationData, downloadICUData, buildChartData), build, gulp.parallel(watch, hugoServer));
exports.deploy = gulp.series(gulp.parallel(downloadData, downloadCountriesData, downloadPopulationData, downloadUruguayVaccinationData, downloadICUData, buildChartData), updateLastMod, build, hugoBuild, purgeCSS, embedCritialCSS);
exports.default = exports.develop;

