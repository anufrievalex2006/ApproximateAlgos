const canvas = document.getElementById('canva');
const ctx = canvas.getContext('2d');

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const clearButton = document.getElementById('clearButton');
const generateButton = document.getElementById('generateButton');
const cityCountInput = document.getElementById('cityCountInput');

let cities = [];
let distances = [];
let population = [];
let bestPath = null;
let isRunning = false;
let animationId = null;
let currentGeneration = 0;

const populationSize = 500;
const mutationChance = 0.1;
const maxGenerations = 1500;
const generationInterval = 50;

let lastUpdateTime = 0;

startButton.addEventListener('click', startAlgorithm);
stopButton.addEventListener('click', stopAlgorithm);
clearButton.addEventListener('click', clearCanvas);

const cityCountSlider = document.getElementById('cityCountSlider');
const cityCountDisplay = document.getElementById('cityCountDisplay');

cityCountSlider.addEventListener('input', function() {
    cityCountDisplay.textContent = cityCountSlider.value;
});

document.getElementById('generateButton').addEventListener('click', function() {
    const cityCount = parseInt(cityCountSlider.value);
    clearCanvas();
    generateRandomCities(cityCount);
});

function generateRandomCities(numCities) {
    cities = [];
    for (let i = 0; i < numCities; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        cities.push({ x, y });
    }
    drawField();
}

canvas.onclick = function (e) {
    const x = e.offsetX;
    const y = e.offsetY;
    cities.push({ x, y });
    drawField();
};

function clearCanvas() {
    stopAlgorithm();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cities = [];
    distances = [];
    population = [];
    bestPath = null;
    currentGeneration = 0;
}

function stopAlgorithm() {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function drawField() {
    for (let city of cities) {
        ctx.fillStyle = '#84C5F8';
        ctx.beginPath();
        ctx.arc(city.x, city.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawPath(path) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawField();
    ctx.strokeStyle = '#84C5F8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cities[path[0]].x, cities[path[0]].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(cities[path[i]].x, cities[path[i]].y);
    }
    ctx.lineTo(cities[path[0]].x, cities[path[0]].y);
    ctx.stroke();
}

function countDistances() {
    for (let i = 0; i < cities.length; i++) {
        distances[i] = [];
        for (let j = 0; j < cities.length; j++) {
            const dx = cities[i].x - cities[j].x;
            const dy = cities[i].y - cities[j].y;
            distances[i][j] = Math.sqrt(dx*dx + dy*dy);
        }
    }
}

function pathDistance(path) {
    let dist = 0;
    for (let i = 0; i < path.length - 1; i++) {
        dist += distances[path[i]][path[i + 1]];
    }
    dist += distances[path[path.length - 1]][path[0]];
    return dist;
}

function randomPath() {
    const path = cities.map((_, i) => i);
    for (let i = path.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [path[i], path[j]] = [path[j], path[i]];
    }
    return path;
}

function initialPopulation() {
    const population = [];
    for (let i = 0; i < populationSize; i++) {
        const path = randomPath();
        const distance = pathDistance(path);
        population.push({ path, distance});
    }
    return population;
}

function selectionBest() {
    let best = population[0];
    for (let i = 1; i < population.length; i++) {
        if (population[i].distance < best.distance) {
            best = population[i];
        }
    }
    return best;
}

function tournamentSelection() {
    const selection = [];
    const size = 5;
    for (let i = 0; i < size; i++) {
        selection.push(population[Math.floor(Math.random() * population.length)]);
    }
    selection.sort((a, b) => a.distance - b.distance);
    return selection[0].path;
}

function crossover(parent1, parent2) {
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * parent1.length);

    const [l, r] = [Math.min(start, end), Math.max(start, end)];
    const child = new Array(parent1.length).fill(null);
    const segment = parent1.slice(l, r + 1);
    child.splice(l, segment.length, ...segment);

    let currentIndex = (r + 1) % parent1.length;
    for (let i = 0; i < parent2.length; i++) {
        const city = parent2[(r + 1 + i) % parent2.length];
        if (!child.includes(city)) {
            child[currentIndex] = city;
            currentIndex = (currentIndex + 1) % parent1.length;
        }
    }
    return child;
}

function mutation(path) {
    const newPath = [...path];
    if (Math.random() < mutationChance) {
        const i = Math.floor(Math.random() * newPath.length);
        let j = Math.floor(Math.random() * newPath.length);
        while (i === j) {
            j = Math.floor(Math.random() * newPath.length);
        }
        [newPath[i], newPath[j]] = [newPath[j], newPath[i]];
    }
    return newPath;
}

function evolution() {
    const newPopulation = [];
    for (let i = 0; i < populationSize; i++) {
        const p1 = tournamentSelection();
        const p2 = tournamentSelection();
        const child = mutation(crossover(p1, p2));
        newPopulation.push({ path: child, distance: pathDistance(child) });
    }
    population = newPopulation;
}

function startAlgorithm() {
    countDistances();
    population = initialPopulation();
    bestPath = selectionBest();
    isRunning = true;
    currentGeneration = 0;
    lastUpdateTime = performance.now();
    animationId = requestAnimationFrame(runGenerationStep);
}

function runGenerationStep(timestamp) {
    if (!isRunning) return;

    if (timestamp - lastUpdateTime >= generationInterval) {
        evolution();
        const best = selectionBest();
        if (best.distance < bestPath.distance) {
            bestPath = best;
        }
        drawPath(bestPath.path);
        lastUpdateTime = timestamp;
        currentGeneration++;
      
        if (currentGeneration >= maxGenerations) {
            stopAlgorithm();
            alert('Алгоритм завершён.');
            return;
        }
    }

    animationId = requestAnimationFrame(runGenerationStep);
}