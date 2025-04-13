let canvas = document.getElementById('canv');
let ctx = canvas.getContext('2d');
let points = [];

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
        let x = Math.floor(Math.random() * (canvas.width - 20)) + 10;
        let y = Math.floor(Math.random() * (canvas.height - 20)) + 10;
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

function distance(p1, p2) {
    let dx = p1[0] - p2[0];
    let dy = p1[1] - p2[1];
    return Math.sqrt(dx*dx + dy*dy);
}

function areArraysSame(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i]) return false;
    return true;
}

function clusterize() {
    let k = parseInt(document.getElementById('kClusters').value);
    if (points.length < k) {
        alert(`You should add at least ${k} points! (${k - points.length} left)`);
        return;
    }
    let clusters = kMeans(points, k);
    drawClusters(clusters);
}

function kMeans(points, k) {
    let centroids = points.slice(0, k);
    let assigns = new Array(points.length);
    let oldAssigns = null;
    while (true) {
        for (let i = 0; i < points.length; i++) {
            let minDist = Infinity, minIndex = -1;
            for (let j = 0; j < k; j++) {
                let dist = distance(points[i], centroids[j]);
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

function drawClusters(assigns) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let colors = ['red', 'blue', 'green', 'yellow', 'lime', 'gray', 'purple', 'brown', 'cyan', 'orange'];
    for (let i = 0; i < points.length; i++) {
        let color = colors[assigns[i] % colors.length];
        drawPoint(points[i][0], points[i][1], color);
    }
}
