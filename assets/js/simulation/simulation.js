import * as PIXI from 'pixi.js'

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

    const Disease = {
        infectionDistance: 16,
        infectionProb: 0.1,
        infectionMinDays: 0.1,
        daysDuration: 14,
        mortalityRate: 0.03
    }

    const State = {
        NORMAL: 1,
        INFECTED: 2,
        RECOVERED: 3,
        DEAD: 4
    }

    const Person = function (texture, radius, x, y, areaWidth, areaHeight) {
        this.areaWidth = areaWidth;
        this.areaHeight = areaHeight;
        this.radius = radius;
        this.do = new PIXI.Sprite(texture);
        this.do.anchor.set(0.5, 0.5);
        this.do.x = x;
        this.do.y = y;
        this.speed = 64;
        let dirAngle = Math.random() * Math.PI * 2 - Math.PI;
        this.dirX = Math.cos(dirAngle);
        this.dirY = Math.sin(dirAngle);
        this.setState(State.NORMAL);
        this.infectedTime = 0;
        this.exposureTime = 0;
        this.exposedLastFrame = false;
    };

    Person.prototype.setState = function (state) {
        this.state = state;
        if (state == State.NORMAL) {
            this.do.tint = 0xFFFFFF;
        }
        else if (state == State.INFECTED) {
            this.do.tint = 0xFFFF00;
        }
        else if (state == State.RECOVERED) {
            this.do.tint = 0x0000FF;
        }
        else if (state == State.DEAD) {
            this.do.tint = 0xFF0000;
            this.speed = 0;
        }
    }

    Person.prototype.addExposureTime = function (time) {
        this.exposureTime += time;
        this.exposedLastFrame = true;
    }

    Person.prototype.update = function (dt) {
        const velX = this.dirX * this.speed;
        const velY = this.dirY * this.speed;
        this.do.x += dt * velX;
        this.do.y += dt * velY;

        const halfRadius = this.radius * 0.5;

        const left = this.do.x - halfRadius;
        if (left < 0) {
            this.do.x = -left + halfRadius;
            this.dirX *= -1;
        }
        else {
            const right = this.do.x + halfRadius;
            if (right > this.areaWidth) {
                this.do.x = this.areaWidth - (right - this.areaWidth) - halfRadius;
                this.dirX *= -1;
            }
        }

        const top = this.do.y - halfRadius;
        if (top < 0) {
            this.do.y = -top + halfRadius;
            this.dirY *= -1;
        }
        else {
            const bottom = this.do.y + halfRadius;
            if (bottom > this.areaHeight) {
                this.do.y = this.areaHeight - (bottom - this.areaHeight) - halfRadius;
                this.dirY *= -1;
            }
        }

        if (this.state == State.NORMAL) {
            //TODO: assuming 1 day = 1 second
            const infectionDays = this.exposureTime;

            if (infectionDays >= Disease.infectionMinDays) {
                if(Math.random() <= Disease.infectionProb) {
                    this.setState(State.INFECTED);
                }
                else {
                    this.exposureTime = 0.0;
                }
            }
        } else if (this.state == State.INFECTED) {
            this.infectedTime += dt;

            //TODO: assuming 1 day = 1 second
            const infectedDays = this.infectedTime;

            if (infectedDays >= Disease.daysDuration) {
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
    };

    const DiseaseChart = function (id, people) {
        this.sampleTime = 0.25;
        this.time = 0;
        this.totalTime = 0;
        this.done = false;
        this.people = people;
        const ctx = document.getElementById(id);
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    pointBackgroundColor: "#28b8d6ff",
                    backgroundColor: "#28b8d680",
                    //TODO: i18n
                    label: "Active Cases",
                    data: [],
                },
                {
                    pointBackgroundColor: "#e54acfff",
                    backgroundColor: "#e54acfff",
                    //TODO: i18n
                    label: "Deaths",
                    data: [],
                }]
            },
            options: {
                responsive: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            max: people.length,
                        }
                    }]
                }
            }
        });
    };

    DiseaseChart.prototype.update = function (dt) {
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
    };

    const width = 512;
    const height = 512;
    const cols = 16;
    const rows = 16;

    const app = new PIXI.Application({ view: document.getElementById('sim'), width: width, height: height });

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

    const randomPerson = people[getRandomInt(0, people.length)];
    randomPerson.setState(State.INFECTED);

    app.ticker.add(function () { gameLoop(app.ticker.deltaMS * 0.001); });

    const chart = new DiseaseChart("chart", people);

    function gameLoop(dt) {
        for (let i = 0; i < people.length; ++i) {
            people[i].update(dt);
        }

        for (let i = 0; i < people.length; ++i) {
            const person = people[i];

            for (let j = i + 1; j < people.length; ++j) {
                const otherPerson = people[j];
                if ((person.state == State.INFECTED && otherPerson.state == State.NORMAL) || (otherPerson.state == State.INFECTED && person.state == State.NORMAL)) {
                    const dx = person.do.x - otherPerson.do.x;
                    const dy = person.do.y - otherPerson.do.y;
                    const distSqrd = dx * dx + dy * dy;

                    if (distSqrd <= Disease.infectionDistance * Disease.infectionDistance) {
                        if (person.state == State.NORMAL) {
                            person.addExposureTime(dt);
                        }
                        if (otherPerson.state == State.NORMAL) {
                            otherPerson.addExposureTime(dt);
                        }
                    }
                }
            }
        }

        chart.update(dt);

        if(chart.done) {
            app.ticker.stop();
        }

    }
}
