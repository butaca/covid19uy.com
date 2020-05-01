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

const Simulation = {
    speed: 1
}

let Bindings = {};
Bindings.avoidanceProbDirty = false;
Bindings["contagion-distance"] = { target: Disease, name: "contagionDistance", update(value) { this.target[this.name] = value; } };
Bindings["contagion-prob"] = { target: Disease, name: "contagionProb", update(value) { this.target[this.name] = value * 0.01; } };
Bindings["contagion-min-hours"] = { target: Disease, name: "contagionMinDays", update(value) { this.target[this.name] = value / 24; } };
Bindings["infection-duration"] = { target: Disease, name: "infectionDurationDays", update(value) { this.target[this.name] = value; } };
Bindings["mortality-rate"] = { target: Disease, name: "mortalityRate", update(value) { this.target[this.name] = value * 0.01; } };

Bindings["avoidance-distance"] = { target: Society, name: "avoidanceDistance", update(value) { this.target[this.name] = value; } };
Bindings["avodiance-prob"] = { target: Society, name: "avoidanceProb", update(value) { this.target[this.name] = value * 0.01; Bindings.avoidanceProbDirty = true; } };

Bindings["simulation-speed"] = { target: Simulation, name: "speed", update(value) { this.target[this.name] = value; } };

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initRanges);
} else {
    initRanges();
}

function initRanges() {
    const ranges = document.querySelectorAll(".simulation-param");
    for (let i = 0; i < ranges.length; ++i) {
        const range = ranges[i];
        const input = range.querySelector("input");
        const tag = range.querySelector(".tag");
        if (input && tag) {
            function updateTag() {
                tag.innerHTML = input.value;
                let binding = Bindings[input.id];
                binding.update(input.value);
            }
            updateTag();
            input.addEventListener('input', updateTag);
            input.addEventListener('change', updateTag);
        }
    }
}
 
export { Disease, Society, Bindings, Simulation };