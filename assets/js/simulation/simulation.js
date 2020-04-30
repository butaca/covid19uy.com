import burger from '../burger'
import nfCookies from '../nf-cookies'
import '../icons'

import * as PIXI from 'pixi.js'
import langEs from "../../../i18n/es.yaml";
import langEn from "../../../i18n/en.yaml";

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", onDOMLoaded);
} else {
    onDOMLoaded();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function onDOMLoaded() {
    burger();
    nfCookies();

    const langs = {
        es: langEs,
        en: langEn
    }

    const htmlLang = document.documentElement.getAttribute("lang");

    let lang = langs.es;
    if (langs.hasOwnProperty(htmlLang)) {
        lang = langs[htmlLang];
    }

    const Disease = {
        contagionDistance: 16,
        contagionProb: 0.1,
        contagionMinDays: 1 / 24,
        infectionDurationDays: 14,
        mortalityRate: 0.03,
    };

    const Society = {
        avoidanceDistance: 32,
        avoidanceProb: 0.8
    };

    const State = {
        NORMAL: 1,
        INFECTED: 2,
        RECOVERED: 3,
        DEAD: 4
    };

    class Person {
        constructor(texture, radius, x, y, areaWidth, areaHeight) {
            this.startX = x;
            this.startY = y;
            this.areaWidth = areaWidth;
            this.areaHeight = areaHeight;
            this.radius = radius;
            this.do = new PIXI.Sprite(texture);
            this.do.anchor.set(0.5, 0.5);
            this.restart();
        }

        restart() {
            this.speed = 64;
            this.do.x = this.startX;
            this.do.y = this.startY;
            let dirAngle = Math.random() * Math.PI * 2 - Math.PI;
            this.dirX = Math.cos(dirAngle);
            this.dirY = Math.sin(dirAngle);
            this.setState(State.NORMAL);
            this.infectedTime = 0;
            this.exposureTime = 0;
            this.exposedLastFrame = false;
            this.avoidanceX = 0;
            this.avoidanceY = 0;
            this.forceDisableAvoidance = false;
            this.updateAvoidance();
        }

        updateAvoidance() {
            this.avoidance = Math.random() < Society.avoidanceProb;
        }

        setState(state) {
            this.state = state;
            if (state == State.NORMAL) {
                this.do.tint = 0x000000;
            }
            else if (state == State.INFECTED) {
                this.do.tint = 0x28b8d6;
            }
            else if (state == State.RECOVERED) {
                this.do.tint = 0x0000ff;
            }
            else if (state == State.DEAD) {
                this.do.tint = 0xe54acf;
                this.speed = 0;
            }
        }

        addExposureTime(time) {
            this.exposureTime += time;
            this.exposedLastFrame = true;
        }

        update(dt) {
            if (!this.forceDisableAvoidance && this.avoidance) {
                let avoidanceMagSqrd = this.avoidanceX * this.avoidanceX + this.avoidanceY * this.avoidanceY;
                if (avoidanceMagSqrd > 0) {
                    let avoidanceMag = Math.sqrt(avoidanceMagSqrd);
                    if (avoidanceMag > 0) {
                        this.dirX = this.avoidanceX / avoidanceMag;
                        this.dirY = this.avoidanceY / avoidanceMag;
                    }
                }
            }
            const velX = this.dirX * this.speed;
            const velY = this.dirY * this.speed;
            this.avoidanceX = 0;
            this.avoidanceY = 0;
            this.do.x += dt * velX;
            this.do.y += dt * velY;
            const left = this.do.x - this.radius;
            if (left < 0) {
                this.do.x = -left + this.radius;
                this.dirX *= -1;
            }
            else {
                const right = this.do.x + this.radius;
                if (right > this.areaWidth) {
                    this.do.x = this.areaWidth - (right - this.areaWidth) - this.radius;
                    this.dirX *= -1;
                }
            }
            const top = this.do.y - this.radius;
            if (top < 0) {
                this.do.y = -top + this.radius;
                this.dirY *= -1;
            }
            else {
                const bottom = this.do.y + this.radius;
                if (bottom > this.areaHeight) {
                    this.do.y = this.areaHeight - (bottom - this.areaHeight) - this.radius;
                    this.dirY *= -1;
                }
            }
            if (this.state == State.NORMAL) {
                //TODO: assuming 1 day = 1 second
                const infectionDays = this.exposureTime;
                if (infectionDays > 0 && infectionDays >= Disease.contagionMinDays) {
                    if (Math.random() <= Disease.contagionProb) {
                        this.setState(State.INFECTED);
                    }
                    else {
                        this.exposureTime = 0.0;
                    }
                }
            }
            else if (this.state == State.INFECTED) {
                this.infectedTime += dt;
                //TODO: assuming 1 day = 1 second
                const infectedDays = this.infectedTime;
                if (infectedDays >= Disease.infectionDurationDays) {
                    if (Math.random() <= Disease.mortalityRate) {
                        this.setState(State.DEAD);
                    }
                    else {
                        this.setState(State.RECOVERED);
                    }
                }
            }
            if (!this.exposedLastFrame) {
                this.exposureTime = 0;
            }
        }

    };

    class DiseaseChart {
        constructor(id, people) {
            this.sampleTime = 0.25;
            this.people = people;
            var ctx = document.getElementById(id);
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        pointBackgroundColor: "#28b8d6ff",
                        backgroundColor: "#28b8d680",
                        label: lang.activeCases.other,
                        data: [],
                    },
                    {
                        pointBackgroundColor: "#e54acfff",
                        backgroundColor: "#e54acfff",
                        label: lang.deaths.other,
                        data: [],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        yAxes: [{
                            ticks: {
                                max: people.length,
                            }
                        }]
                    }
                }
            });
            this.restart();
        }

        update(dt) {
            if (!this.done) {
                this.time -= dt;
                this.totalTime += dt;
                if (this.time <= 0) {
                    let totalInfected = 0;
                    let totalDeaths = 0;
                    for (let i = 0; i < this.people.length; ++i) {
                        const person = this.people[i];
                        if (person.state == State.INFECTED) {
                            totalInfected++;
                        }
                        else if (person.state == State.DEAD) {
                            totalDeaths++;
                        }
                    }
                    this.time += this.sampleTime;
                    this.chart.data.datasets[0].data.push(totalInfected);
                    this.chart.data.datasets[1].data.push(totalDeaths);
                    //TODO: assuming 1 day = 1 second
                    this.chart.data.labels.push(Math.floor(this.totalTime));
                    this.chart.update();
                    if (totalInfected == 0) {
                        this.done = true;
                    }
                }
            }
        }

        restart() {
            for (let i = 0; i < this.chart.data.datasets.length; ++i) {
                this.chart.data.datasets[i].data = [];
            }
            this.chart.data.labels = [];
            this.chart.update();
            this.time = 0;
            this.totalTime = 0;
            this.done = false;
        }

    }

    let avoidanceProbDirty = false;

    let bindings = {};
    bindings["contagion-distance"] = { target: Disease, name: "contagionDistance", update(value) { this.target[this.name] = value; } };
    bindings["contagion-prob"] = { target: Disease, name: "contagionProb", update(value) { this.target[this.name] = value * 0.01; } };
    bindings["contagion-min-hours"] = { target: Disease, name: "contagionMinDays", update(value) { this.target[this.name] = value / 24; } };
    bindings["infection-duration"] = { target: Disease, name: "infectionDurationDays", update(value) { this.target[this.name] = value; } };
    bindings["mortality-rate"] = { target: Disease, name: "mortalityRate", update(value) { this.target[this.name] = value * 0.01; } };

    bindings["avoidance-distance"] = { target: Society, name: "avoidanceDistance", update(value) { this.target[this.name] = value; } };
    bindings["avodiance-prob"] = { target: Society, name: "avoidanceProb", update(value) { this.target[this.name] = value * 0.01; avoidanceProbDirty = true; } };

    const ranges = document.querySelectorAll(".simulation-param");
    for (let i = 0; i < ranges.length; ++i) {
        const range = ranges[i];
        const input = range.querySelector("input");
        const tag = range.querySelector(".tag");
        if (input && tag) {
            function updateTag() {
                tag.innerHTML = input.value;
                let binding = bindings[input.id];
                binding.update(input.value);
            }
            updateTag();
            input.addEventListener('input', updateTag);
            input.addEventListener('change', updateTag);
        }
    }

    const width = 512;
    const height = 512;
    const cols = 16;
    const rows = 16;

    const app = new PIXI.Application({ view: document.getElementById('sim'), width: width, height: height, backgroundColor: 0xFAFAFA });

    const resizeCanvas = function() {
        const parent = app.view.parentNode;
        const clientSize = Math.min(parent.clientWidth, parent.clientHeight);
        app.renderer.resize(clientSize, clientSize);
        app.stage.scale.set(clientSize / width, clientSize / height);
    }

    window.addEventListener('resize', resizeCanvas);

    const peopleContainer = new PIXI.Container();
    app.stage.addChild(peopleContainer);

    const people = [];

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const renderer = app.renderer;

    const radius = 4;
    const personGraphics = new PIXI.Graphics();
    personGraphics.beginFill(0xFFFFFF);
    personGraphics.drawCircle(0, 0, radius);
    const personTexture = renderer.generateTexture(personGraphics);

    for (let col = 0; col < cols; ++col) {
        for (let row = 0; row < rows; ++row) {
            let person = new Person(personTexture, radius, (col + 0.5) * cellWidth, (row + 0.5) * cellHeight, width, height);
            peopleContainer.addChild(person.do);
            people.push(person);
        }
    }

    app.ticker.add(function () { gameLoop(app.ticker.deltaMS * 0.001); });

    const chart = new DiseaseChart("chart", people);

    const btnRestart = document.getElementById('restart');
    btnRestart.addEventListener('click', restart);

    let restartGame = true;

    resizeCanvas();

    function gameLoop(dt) {
        if (restartGame) {
            for (let i = 0; i < people.length; ++i) {
                people[i].restart();
            }
            chart.restart();
            restartGame = false;

            const randomPerson = people[getRandomInt(0, people.length)];
            randomPerson.setState(State.INFECTED);
            randomPerson.forceDisableAvoidance = true;
        }

        for (let i = 0; i < people.length; ++i) {
            people[i].update(dt);
        }

        for (let i = 0; i < people.length; ++i) {
            const person = people[i];

            if (avoidanceProbDirty) {
                person.updateAvoidance();
            }

            for (let j = i + 1; j < people.length; ++j) {
                const otherPerson = people[j];
                const dx = person.do.x - otherPerson.do.x;
                const dy = person.do.y - otherPerson.do.y;
                const distSqrd = dx * dx + dy * dy;

                if ((person.state == State.INFECTED && otherPerson.state == State.NORMAL) || (otherPerson.state == State.INFECTED && person.state == State.NORMAL)) {
                    if (distSqrd <= Disease.contagionDistance * Disease.contagionDistance) {
                        if (person.state == State.NORMAL) {
                            person.addExposureTime(dt);
                        }
                        if (otherPerson.state == State.NORMAL) {
                            otherPerson.addExposureTime(dt);
                        }
                    }
                }

                if (distSqrd <= Society.avoidanceDistance * Society.avoidanceDistance) {

                    let toPersonX = (person.do.x - otherPerson.do.x);
                    let toPersonY = (person.do.y - otherPerson.do.y);
                    let toPersonMagSqrd = toPersonX * toPersonX + toPersonY * toPersonY;
                    if (toPersonMagSqrd > 0) {
                        let toPersonMag = Math.sqrt(toPersonMagSqrd);
                        if (toPersonMag) {
                            toPersonX /= toPersonMag;
                            toPersonY /= toPersonMag;
                        }
                    }

                    person.avoidanceX += toPersonX;
                    person.avoidanceY += toPersonY;

                    otherPerson.avoidanceX -= toPersonX;
                    otherPerson.avoidanceY -= toPersonY;
                }
            }
        }

        avoidanceProbDirty = false;

        chart.update(dt);

        if (chart.done) {
            app.ticker.stop();
        }

    }

    function restart() {
        app.ticker.stop();
        app.ticker.start();
        restartGame = true;
    }
}
