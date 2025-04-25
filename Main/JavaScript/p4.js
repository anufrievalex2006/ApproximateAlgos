const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
let points = [], pheromones = [];
let pIndex = 1;

const alpha = 1; // влияние феромона
const beta = 2;  // влияние расстояния
const evaporationRate = 0.1;
const Q = 100;   // количество феромона

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    points.push({x, y});
    drawPoint(x, y, pIndex);
    pIndex++;
});

function drawPoint(x, y, i) {
    ctx.beginPath();

    ctx.fillStyle = '#84C5F8';
    
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillText(i, x + 10, y + 10);
    ctx.fill();
}

document.getElementById('startButton').addEventListener('click', findPath);
const cityCountSlider = document.getElementById('cityCountSlider');
const cityCountDisplay = document.getElementById('cityCountDisplay');

cityCountSlider.addEventListener('input', function() {
  cityCountDisplay.textContent = cityCountSlider.value;
});

document.getElementById('generateButton').addEventListener('click', function() {
    const cityCount = parseInt(cityCountSlider.value);
    genPoints(cityCount);
});

function genPoints() {
    clearMap();
    let k = parseInt(cityCountSlider.value);
    for (let i = 0; i < k; i++) {
        let x = Math.floor(Math.random() * (canvas.width - 20)) + 10;
        let y = Math.floor(Math.random() * (canvas.height - 20)) + 10;
        points.push({x, y});
        drawPoint(x, y, pIndex++);
    }
}

function generateRandomCities(numCities) {
    cities = [];
    for (let i = 0; i < numCities; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        cities.push({ x, y });
    }
    drawField();
}

function generatePoints() {
    clearMap();
    let k = parseInt(document.getElementById('kPoints').value);
    for (let i = 0; i < k; i++) {
        let x = Math.floor(Math.random() * (canvas.width - 20)) + 10;
        let y = Math.floor(Math.random() * (canvas.height - 20)) + 10;
        points.push({x, y});
        drawPoint(x, y, pIndex++);
    }
}

function clearMap() {
    pIndex = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    pheromones = [];
}

function distance(v1, v2) {
    return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
}

function initializePheromones() {
    pheromones = Array(points.length).fill().map(() => 
        Array(points.length).fill(0.1)
    );
}

function findPath() {
    if (points.length < 2) return;
    
    initializePheromones();
    let bestPath = null, bestLength = Infinity;
    for (let i = 0; i < 100; i++) {
        let paths = [], lengths = [];
        for (let ant = 0; ant < 20; ant++) {
            let visitedCells = new Set();
            let cur = Math.floor(Math.random() * points.length);
            let path = [cur];
            visitedCells.add(cur);
            let pathLength = 0;

            while (visitedCells.size < points.length) {
                let next = selectNextCity(cur, visitedCells);
                pathLength += distance(points[cur], points[next]);
                path.push(next);
                visitedCells.add(next);
                cur = next;
            }
            pathLength += distance(points[cur], points[path[0]]);
            paths.push(path);
            lengths.push(pathLength);
            if (pathLength < bestLength) {
                bestLength = pathLength;
                bestPath = [...path];
            }
        }
        updatePheromones(paths, lengths);
    }
    drawPath(bestPath);
}

function selectNextCity(cur, visited) {
    let probs = [];
    let sum = 0;

    for (let i = 0; i < points.length; i++) {
        if (!visited.has(i)) {
            let pher = Math.pow(pheromones[cur][i], alpha);
            let visibility = Math.pow(1 / distance(points[cur], points[i]), beta);
            probs[i] = pher * visibility;
            sum += probs[i];
        }
        else probs[i] = 0;
    }

    let rnd = Math.random() * sum;
    let probSum = 0;
    for (let i = 0; i < points.length; i++) {
        if (probs[i] > 0) {
            probSum += probs[i];
            if (probSum >= rnd) return i;
        }
    }
    return -1;
}

function updatePheromones(paths, lengths) {
    for (let i = 0; i < points.length; i++)
        for (let j = 0; j < points.length; j++)
            pheromones[i][j] *= (1 - evaporationRate);

    paths.forEach((path, antIndex) => {
        let amount = Q / lengths[antIndex];
        for (let i = 0; i < path.length - 1; i++) {
            pheromones[path[i]][path[i + 1]] += amount;
            pheromones[path[i + 1]][path[i]] += amount;
        }
        pheromones[path[path.length - 1]][path[0]] += amount;
        pheromones[path[0]][path[path.length - 1]] += amount;
    });
}

function drawPath(path) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < points.length; i++) {
        drawPoint(points[i].x, points[i].y, i + 1);
    }

    ctx.beginPath();
    ctx.moveTo(points[path[0]].x, points[path[0]].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(points[path[i]].x, points[path[i]].y);
    }
    ctx.lineTo(points[path[0]].x, points[path[0]].y);
    ctx.strokeStyle = '#84C5F8';
    
    ctx.lineWidth = 2;
    ctx.stroke();
}
