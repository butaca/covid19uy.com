import departmentsData from "./data/uruguayDepartments.json"

function uruguayMap() {

    var departments = departmentsData.departments;
    var uruguayMap = document.getElementById("uruguay-map");


    var minActives = Number.MAX_SAFE_INTEGER;
    var maxActives = 0;
    for (var key in departments) {
        if (departments.hasOwnProperty(key)) {
            var actives = departments[key];
            minActives = Math.min(minActives, actives);
            maxActives = Math.max(maxActives, actives);
        }
    }

    var paths = uruguayMap.getElementsByTagName("path");
    for (var i = 0; i < paths.length; ++i) {
        (function (path) {
            var department = departments[path.getAttribute("name")];
            var activeCases = department;
            if (activeCases > 0) {
                var center = path.getAttribute("center").split(",");
                var x = center[0];
                var y = center[1];

                var svgNS = "http://www.w3.org/2000/svg";
                var newText = document.createElementNS(svgNS, "text");
                newText.setAttribute("x", x);
                newText.setAttribute("y", y);
                newText.setAttribute("font-size", "42");
                newText.setAttribute("dominant-baseline", "middle");
                newText.setAttribute("text-anchor", "middle");
                newText.setAttribute("pointer-events", "none");
                newText.setAttribute("fill", "black");
                newText.setAttribute("stroke-width", "0");
                newText.setAttribute("font-weight", "bold");

                var textNode = document.createTextNode(activeCases.toString());
                newText.appendChild(textNode);
                uruguayMap.appendChild(newText);

                path.setAttribute('style', 'fill: #40bfdb');

                var n = (activeCases - minActives) / (maxActives - minActives);
                path.setAttribute("fill-opacity", Math.pow(n, 1.0 / 3.0));
            }
        })(paths[i]);
    }
}

export default uruguayMap;