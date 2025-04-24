const canvas = document.getElementById("canva");
canvas.willReadFrequently = true;
const ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

document.getElementById("clearButton").addEventListener("click", clearCanvas);
document.getElementById("startButton").addEventListener("click", recognize);

let painting = false;
const brushSize = 30;
const brushRadius = brushSize / 2;

function startPosition(e) {
    painting = true;
    draw(e);
}

function endPosition() {
    painting = false;
    ctx.beginPath();
}

function draw(e) {
    if (!painting) return;

    const pos = getCanvasPosition(e);
    const x = pos.x - brushRadius; 
    const y = pos.y - brushRadius; 

    ctx.beginPath();
    ctx.arc(x + brushRadius, y + brushRadius, brushRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = 'black'; 
    ctx.fill();
}

function getCanvasPosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseout', endPosition); 

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let W1, b1, W2, b2;
async function loadWeights() {
   const [W1Data, b1Data, W2Data, b2Data] = await Promise.all([
        fetch('W1.txt').then(res => res.text()),
        fetch('b1.txt').then(res => res.text()),
        fetch('W2.txt').then(res => res.text()),
        fetch('b2.txt').then(res => res.text())
    ]);
        
    W1 = W1Data.trim().split('\n').map(row => row.trim().split(' ').map(Number));
    b1 = b1Data.trim().split(' ').map(Number);
    W2 = W2Data.trim().split('\n').map(row => row.trim().split(' ').map(Number));
    b2 = b2Data.trim().split(' ').map(Number);
}

function centeringAndDataArray() {
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = image.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    const threshold = 0.5 * 255;
    let foundPixels = false;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            if ((pixels[index] + pixels[index+1] + pixels[index+2]) / 3 < threshold) {
                foundPixels = true;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (!foundPixels) {
        return new Array(28*28).fill(0);
    }

    const padding = 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width - 1, maxX + padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, 28, 28);
    
    const maxDigitSize = 20;
    const outputSize = 28;
    const aspectRatio = Math.min(maxDigitSize / width, maxDigitSize / height);
    const digitWidth = Math.floor(width * aspectRatio);
    const digitHeight = Math.floor(height * aspectRatio);
    const horizontalField = Math.floor((outputSize - digitWidth) / 2);
    const verticalField = Math.floor((outputSize - digitHeight) / 2);
    
    tempCtx.drawImage(canvas, minX, minY, width, height, horizontalField, verticalField, digitWidth, digitHeight);

    const finalData = tempCtx.getImageData(0, 0, 28, 28).data;
    const result = new Array(28*28);
    
    for (let i = 0, j = 0; i < finalData.length; i += 4, j++) {
        const r = finalData[i];
        const g = finalData[i+1];
        const b = finalData[i+2];
    
        result[j] = Math.min(1, (255 - (r + g + b) / 3) / 255);
    }

    return result;
}

function recognize() {
    const input = centeringAndDataArray();
    const grid = [];
    for (let i = 0; i < 28; i++) {
      grid.push(input.slice(i * 28, i * 28 + 28));
    }
}

function relu(matrix) {
    let result = [];
    for (let i = 0; i < matrix.length; i++) {
        result[i] = [];
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] < 0) {
               result[i].push(0);
            } else {
                result[i].push(matrix[i][j]);
            }
        }
    }
    return result;
}

function softmax(predictions) {
    const max = Math.max(...predictions[0]);
    const exp = [];

    for (let i = 0; i < predictions[0].length; i++){
        exp.push(Math.exp(predictions[0][i] - max));
    }

    let sum = 0;
    for(let i = 0; i < exp.length; i++){
        sum += exp[i];
    }

    const result = [];
    for (let i = 0; i < exp.length; i++){
        result.push(exp[i] / sum);
    }

    return [result];
}

function predict(matrix) {
    const t1 = matmul(matrix, W1); 
    const h1 = relu(addBias(t1, b1));
    const t2 = matmul(h1, W2);
    const z = softmax(addBias(t2, b2));
    return z;
}

function matmul(a, b) {
    const result = [];
    for (let i = 0; i < a.length; i++) {
        result[i] = [];
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a[0].length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function addBias(matrix, bias){
    const result = [];
    for(let i = 0; i < matrix.length; i++) {
        result[i] = [];
        for (let j = 0; j < matrix[i].length; j++){
            let sum = 0;
            result[i][j] = matrix[i][j] + bias[j];
        }
    }
    return result;
}

function getCanvasData() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const grayData = [];

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        grayData.push(brightness / 255);
    }

    return grayData;
}

function updateResult(predictedDigit) {
    const result = document.getElementById("result");
    result.textContent = `Ответ:   ${predictedDigit}`;
}

document.getElementById("startButton").onclick = function() {
    const inputData = centeringAndDataArray();  
    const inputMatrix = [inputData];
    const output = predict(inputMatrix);

    const predictedDigit = output[0].indexOf(Math.max(...output[0]));  
    updateResult(predictedDigit);  
}

document.getElementById("clearButton").onclick = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateResult('');
}

loadWeights();
