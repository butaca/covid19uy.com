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

var Disease = {
    infectionDistance: 16,
    infectionProb: 0.25,
    infectionMinDays: 0.1,
    daysDuration: 14,
    mortalityRate: 0.03
}

function onDOMLoaded() {
    var width = 512;
    var height = 512;
    var cols = 16;
    var rows = 16;

    var app = new PIXI.Application({ width: width, height: height });
    document.body.appendChild(app.view);

    var peopleContainer = new PIXI.Container();
    app.stage.addChild(peopleContainer);

    var people = [];

    var cellWidth = width / cols;
    var cellHeight = height / rows;

    for (var col = 0; col < cols; ++col) {
        for (var row = 0; row < rows; ++row) {
            let person = new Person((col + 0.5) * cellWidth, (row + 0.5) * cellHeight, width, height);
            peopleContainer.addChild(person.do);
            people.push(person);
        }
    }

    var randomPerson = people[getRandomInt(0, people.length)];
    randomPerson.setState(State.INFECTED);

    app.ticker.add(function () { gameLoop(app.ticker.deltaMS * 0.001); });

    function gameLoop(dt) {
        for (var i = 0; i < people.length; ++i) {
            people[i].update(dt);
        }

        for (var i = 0; i < people.length; ++i) {
            var person = people[i];

            for (var j = i + 1; j < people.length; ++j) {
                var otherPerson = people[j];
                if ((person.state == State.INFECTED && otherPerson.state == State.NORMAL) || (otherPerson.state == State.INFECTED && person.state == State.NORMAL)) {
                    var dx = person.do.x - otherPerson.do.x;
                    var dy = person.do.y - otherPerson.do.y;
                    var distSqrd = dx * dx + dy * dy;

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

    }
}

var State = {
    NORMAL: 1,
    INFECTED: 2,
    RECOVERED: 3,
    DEATH: 4
}

var Person = function (x, y, areaWidth, areaHeight) {
    this.areaWidth = areaWidth;
    this.areaHeight = areaHeight;
    this.radius = 4;
    this.do = new PIXI.Graphics();
    this.do.beginFill(0xFFFFFF);
    this.do.drawCircle(0, 0, this.radius);
    this.do.x = x;
    this.do.y = y;
    this.speed = 64;
    var dirAngle = Math.random() * Math.PI * 2 - Math.PI;
    this.dirX = Math.cos(dirAngle);
    this.dirY = Math.sin(dirAngle);
    this.setState(State.NORMAL);
    this.infectedTime = 0;
    this.exposureTime = 0;
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
    else if (state == State.DEATH) {
        this.do.tint = 0xFF0000;
        this.speed = 0;
    }
}

Person.prototype.addExposureTime = function (time) {
    this.exposureTime += time;
}

Person.prototype.update = function (dt) {
    var velX = this.dirX * this.speed;
    var velY = this.dirY * this.speed;
    this.do.x += dt * velX;
    this.do.y += dt * velY;

    var halfRadius = this.radius * 0.5;

    var left = this.do.x - halfRadius;
    if (left < 0) {
        this.do.x = -left + halfRadius;
        this.dirX *= -1;
    }
    else {
        var right = this.do.x + halfRadius;
        if (right > this.areaWidth) {
            this.do.x = this.areaWidth - (right - this.areaWidth) - halfRadius;
            this.dirX *= -1;
        }
    }

    var top = this.do.y - halfRadius;
    if (top < 0) {
        this.do.y = -top + halfRadius;
        this.dirY *= -1;
    }
    else {
        var bottom = this.do.y + halfRadius;
        if (bottom > this.areaHeight) {
            this.do.y = this.areaHeight - (bottom - this.areaHeight) - halfRadius;
            this.dirY *= -1;
        }
    }

    if (this.state == State.NORMAL) {
        //TODO: assuming 1 day = 1 second
        var infectionDays = this.exposureTime;

        if (infectionDays >= Disease.infectionMinDays && Math.random() < Disease.infectionProb) {
            this.setState(State.INFECTED);
        }
    } else if (this.state == State.INFECTED) {
        this.infectedTime += dt;

        //TODO: assuming 1 day = 1 second
        var infectedDays = this.infectedTime;

        if (infectedDays >= Disease.daysDuration) {
            if (Math.random() <= Disease.mortalityRate) {
                this.setState(State.DEATH);
            }
            else {
                this.setState(State.RECOVERED);
            }
        }
    }
}
