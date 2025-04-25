class Point {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.index = index;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.fillText(this.index, this.x + 10, this.y + 10);
        ctx.fill();
    }
}

class Path {
    constructor(points, len) {
        this.points = points;
        this.length = len;
    }

    draw(ctx, pointsToDraw) {
        ctx.beginPath();
        ctx.moveTo(pointsToDraw[this.points[0]].x, pointsToDraw[this.points[0]].y);
        for (const point of this.points.slice(1)) {
            ctx.lineTo(pointsToDraw[point].x, pointsToDraw[point].y);
        }
        ctx.lineTo(pointsToDraw[this.points[0]].x, pointsToDraw[this.points[0]].y);
        ctx.strokeStyle = 'red';
        ctx.stroke();
    }
}

class Ant {
    constructor(points, phers, alpha, beta) {
        this.points = points;
        this.pheromones = phers;
        this.alpha = alpha;
        this.beta = beta;
    }

    findPath() {
        let visitedCells = new Set();
        let cur = Math.floor(Math.random() * this.points.length);
        let path = [cur];
        visitedCells.add(cur);
        let pathLength = 0;

        while (visitedCells.size < this.points.length) {
            let next = this.selectNextCity(cur, visitedCells);
            pathLength += distance(this.points[cur], this.points[next]);
            path.push(next);
            visitedCells.add(next);
            cur = next;
        }
        pathLength += distance(this.points[cur], this.points[path[0]]);
        return new Path(path, pathLength);
    }

    selectNextCity(cur, visited) {
        let probs = [];
        let sum = 0;

        for (let i = 0; i < this.points.length; i++) {
            if (!visited.has(i)) {
                let pher = Math.pow(this.pheromones[cur][i], this.alpha);
                let visibility = Math.pow(1 / distance(this.points[cur], this.points[i]), this.beta);
                probs[i] = pher * visibility;
                sum += probs[i];
            }
            else probs[i] = 0;
        }

        let rnd = Math.random() * sum;
        let probSum = 0;
        for (let i = 0; i < this.points.length; i++) {
            if (probs[i] > 0) {
                probSum += probs[i];
                if (probSum >= rnd) return i;
            }
        }
        return -1;
    }
}

const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const inputKPoints = document.getElementById('kPoints');
let points = [], pheromones = [];
let pIndex = 1;

const alpha = 1;
const beta = 2;
const evaporationRate = 0.1;
const Q = 100;

canvas.addEventListener('click', function(event) {
    if (points.length >= 500) {
        alert('Maximum number of points exceeded. (500)');
        return;
    }
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    points.push(new Point(x, y, pIndex));
    points[points.length - 1].draw(ctx);
    pIndex++;
});

function generatePoints() {
    if (inputKPoints.value === '') {
        alert('Please enter valid number of points to generate (1-500)');
        return;
    }
    
    let k = parseInt(inputKPoints.value);
    if (k > 500 || k < 1) {
        alert('Number of points to generate should be valid (1-500)');
        return;
    }
    
    clearMap();
    for (let i = 0; i < k; i++) {
        let x = Math.floor(Math.random() * (canvas.width - 20)) + 10;
        let y = Math.floor(Math.random() * (canvas.height - 20)) + 10;
        points.push(new Point(x, y, pIndex));
        points[points.length - 1].draw(ctx);
        pIndex++;
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
    let bestPath = null, bestLen = Infinity;
    for (let i = 0; i < 100; i++) {
        let paths = [], lengths = [];
        for (let ai = 0; ai < 20; ai++) {
            let ant = new Ant(points, pheromones, alpha, beta);
            let path = ant.findPath();

            paths.push(path.points);
            lengths.push(path.length);
            if (path.length < bestLen) {
                bestLen = path.length;
                bestPath = new Path([...path.points], path.length);
            }
        }
        updatePheromones(paths, lengths);
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of points)
        p.draw(ctx);

    bestPath.draw(ctx, points);
}

function updatePheromones(paths, lengths) {
    for (let i = 0; i < points.length; i++)
        for (let j = 0; j < points.length; j++)
            pheromones[i][j] *= (1 - evaporationRate);

    for (const [ind, path] of paths.entries()) {
        let amount = Q / lengths[ind];
        for (let i = 0; i < path.length - 1; i++) {
            pheromones[path[i]][path[i + 1]] += amount;
            pheromones[path[i + 1]][path[i]] += amount;
        }
        pheromones[path[path.length - 1]][path[0]] += amount;
        pheromones[path[0]][path[path.length - 1]] += amount;
    }
}