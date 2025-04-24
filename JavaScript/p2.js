let canvas = document.getElementById('canv');
let ctx = canvas.getContext('2d');
let points = [];
const textarea = document.getElementById('points-info');
let kColors = 0;
const colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'brown', 'gray', 'lime'];

function drawPoint(x, y, color) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}

function generateKPoints() {
    clearMap();
    let k = parseInt(document.getElementById('kGener').value);
    for (let i = 0; i < k; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * (canvas.width - 40)) + 20;
            y = Math.floor(Math.random() * (canvas.height - 40)) + 20;
        }
        while (points.includes([x, y]));
        points.push([x, y]);
        drawPoint(x, y, 'black');
    }
}

function clearMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
}

canvas.addEventListener('click', function(e) {
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    points.push([x, y]);
    drawPoint(x, y, 'black');    
});

function euclideanDist(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx*dx + dy*dy);
}

function manhattanDist(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.abs(dx) + Math.abs(dy);
}

function chebyshevDist(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.max(Math.abs(dx), Math.abs(dy));
}

function areArraysSame(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}

function clusterize() {
    let k = parseInt(document.getElementById('kClusters').value);

    k = Math.min(points.length, k);
    kColors = Math.min(k, 10);
    textarea.value = 'Euclidean-Manhattan-Chebyshev\n';
    for (let i = 0; i < kColors; i++) 
        textarea.value += `${i + 1} - ${colors[i]}\n`;
    
    let clustersEuclidean = kMeans(points, k, euclideanDist);
    let clustersManhattan = kMeans(points, k, manhattanDist);
    let clustersChebyshev = kMeans(points, k, chebyshevDist);
    drawDifferentClusters(clustersEuclidean, clustersManhattan, clustersChebyshev);
}

function clusterizeEuclidean() {
    let k = parseInt(document.getElementById('kClusters').value);

    k = Math.min(points.length, k);
    textarea.value = 'Euclidean-Manhattan-Chebyshev\n';
    for (let i = 0; i < kColors; i++) 
        textarea.value += `${i + 1} - ${colors[i]}\n`;

    let clusters = kMeans(points, k, euclideanDist);
    drawClusters(clusters);
}

function clusterizeManhattan() {
    let k = parseInt(document.getElementById('kClusters').value);

    k = Math.min(points.length, k);
    textarea.value = 'Euclidean-Manhattan-Chebyshev\n';
    for (let i = 0; i < kColors; i++) 
        textarea.value += `${i + 1} - ${colors[i]}\n`;

    let clusters = kMeans(points, k, manhattanDist);
    drawClusters(clusters);
}

function clusterizeChebyshev() {
    let k = parseInt(document.getElementById('kClusters').value);

    k = Math.min(points.length, k);
    textarea.value = 'Euclidean-Manhattan-Chebyshev\n';
    for (let i = 0; i < kColors; i++) 
        textarea.value += `${i + 1} - ${colors[i]}\n`;

    let clusters = kMeans(points, k, chebyshevDist);
    drawClusters(clusters);
}

function kMeans(points, k, distFunc) {
    let centroids = points.slice(0, k);
    let assigns = new Array(points.length);
    let oldAssigns = null;
    while (true) {
        for (let i = 0; i < points.length; i++) {
            let minDist = Infinity, minIndex = -1;
            for (let j = 0; j < k; j++) {
                let dist = distFunc(points[i], centroids[j]);
                if (dist < minDist) {
                    minDist = dist;
                    minIndex = j;
                }
            }
            assigns[i] = minIndex;
        }
        if (oldAssigns && areArraysSame(assigns, oldAssigns)) break;
        
        oldAssigns = [...assigns];
        let newCentroids = new Array(k).fill(null).map(() => [0,0]);
        let counts = new Array(k).fill(0);
        for (let i = 0; i < points.length; i++) {
            let id = assigns[i];
            newCentroids[id][0] += points[i][0];
            newCentroids[id][1] += points[i][1];
            counts[id]++;
        }
        for (let i = 0; i < k; i++) {
            if (counts[i] > 0) {
                centroids[i] = [
                    newCentroids[i][0] / counts[i],
                    newCentroids[i][1] / counts[i]
                ];
            }
        }
    }
    return assigns;
}

function drawClusters(clusters) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < points.length; i++) {
        let c = clusters[i];
        drawPoint(points[i][0], points[i][1], colors[c % colors.length]);
    }
}

function drawDifferentClusters(clustersEuclidean, clustersManhattan, clustersChebyshev) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (textarea.value === '') {
        textarea.value = 'Euclidean-Manhattan-Chebyshev\n';
        for (let i = 0; i < kColors; i++)
            textarea.value += `${i + 1} - ${colors[i]}\n`;
    }
    for (let i = 0; i < points.length; i++) {
        let e = clustersEuclidean[i];
        let m = clustersManhattan[i];
        let c = clustersChebyshev[i];
        
        if (e === m && m === c) drawPoint(points[i][0], points[i][1], colors[e % colors.length]);
        else {
            drawPoint(points[i][0], points[i][1], 'black');
            ctx.fillStyle = 'black';
            ctx.font = '10px Arial';
            ctx.fillText(`${e+1}-${m+1}-${c+1}`, points[i][0] + 5, points[i][1] + 10);
        }
    }
}