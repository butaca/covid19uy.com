import * as PIXI from 'pixi.js'
import { Disease, Society } from './params'

const State = {
    NORMAL: 1,
    INFECTED: 2,
    RECOVERED: 3,
    DEAD: 4
};

class Person {
    constructor(texture, radius, x, y, areaWidth, areaHeight, sharedState) {
        this.startX = x;
        this.startY = y;
        this.areaWidth = areaWidth;
        this.areaHeight = areaHeight;
        this.radius = radius;
        this.sharedState = sharedState;
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
                let mortalityRate = Disease.mortalityRate;
                if (this.sharedState.totalInfected >= Society.healthSystemCapacity) {
                    mortalityRate = Math.min(mortalityRate + Society.overloadMortalityRateIncrease, 1.0);
                }

                if (Math.random() <= mortalityRate) {
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

export { Person, State };