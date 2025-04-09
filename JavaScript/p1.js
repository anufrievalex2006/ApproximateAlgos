let mode = '';
let start = null, end = null;
let mapData = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function bfs(start, end) {
    let cells = document.querySelectorAll('.cell');
    let queue = [[start]], visitedCells = new Set();
    let key = pos => `${pos.row},${pos.col}`;
    visitedCells.add(key(start));
    
    while (queue.length > 0) {
        let path = queue.shift();
        let cur = path[path.length - 1];
        
        let curCell = cells[cur.row * mapData.length + cur.col];
        if (!curCell.classList.contains('start') && !curCell.classList.contains('end'))
            curCell.classList.add('current');
        await delay(20);

        if (cur.row == end.row && cur.col == end.col) {
            curCell.classList.remove('current');
            for (let i = 1; i < path.length - 1; i++) {
                let pathCell = cells[path[i].row * mapData.length + path[i].col];
                pathCell.classList.remove('visited');
                pathCell.classList.add('path');
                await delay(20);
            }
            return path;
        }
        
        let dirs = [
            {row: -1, col: 0},
            {row: 1, col: 0},
            {row: 0, col: -1},
            {row: 0, col: 1}
        ];
        for (let d of dirs) {
            let newY = cur.row + d.row;
            let newX = cur.col + d.col;
            if (newX >= 0 && newX < mapData.length && newY >= 0 && newY < mapData.length &&
                mapData[newY][newX] !== 1 && !visitedCells.has(key({row: newY, col: newX}))) {
                let toConsider = cells[newY * mapData.length + newX];
                if (!toConsider.classList.contains('start') && !toConsider.classList.contains('end'))
                    toConsider.classList.add('considering');
            }
        }
        await delay(20);
        for (let d of dirs) {
            let newY = cur.row + d.row;
            let newX = cur.col + d.col;
            if (newX >= 0 && newX < mapData.length && newY >= 0 && newY < mapData.length &&
                mapData[newY][newX] !== 1 && !visitedCells.has(key({row: newY, col: newX}))) {
                let newCell = cells[newY * mapData.length + newX];
                if (!newCell.classList.contains('start') && !newCell.classList.contains('end')) {
                    newCell.classList.remove('considering');
                    newCell.classList.add('visited');
                }
                let newPath = [...path, {row: newY, col: newX}];
                queue.push(newPath);
                visitedCells.add(key({row: newY, col: newX}));
            }
        }

        if (!curCell.classList.contains('start') && !curCell.classList.contains('end')) {
            curCell.classList.remove('current');
            curCell.classList.add('visited');
        }
    }
    return null;
}

function generateMaze() {
    let size = parseInt(document.getElementById('mapSize').value);
    if (size > 100) {
        alert('Size should not be more than 100!');
        return;
    }
    generateMap();
    let cells = document.querySelectorAll('.cell');
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            mapData[i][j] = 1;
            let cell = cells[i * size + j];
            cell.classList.add('wall');
        }
    }

    let startX = 0, startY = 0;
    let walls = [];
    mapData[startY][startX] = 0;

    let startCell = cells[startY * size + startX];
    startCell.classList.remove('wall');

    if (startY + 2 < size) {
        walls.push({
            y: startY + 2,
            x: startX,
            fromY: startY + 1,
            fromX: startX
        });
    }
    if (startY - 2 >= 0) {
        walls.push({
            y: startY - 2,
            x: startX,
            fromY: startY - 1,
            fromX: startX
        });
    }
    if (startX + 2 < size) {
        walls.push({
            y: startY,
            x: startX + 2,
            fromY: startY,
            fromX: startX + 1
        });
    }
    if (startX - 2 >= 0) {
        walls.push({
            y: startY,
            x: startX - 2,
            fromY: startY,
            fromX: startX - 1
        });
    }

    while (walls.length > 0) {
        let id = Math.floor(Math.random() * walls.length);
        let w = walls[id];
        walls.splice(id, 1);

        if (mapData[w.y][w.x] === 1) {
            mapData[w.y][w.x] = 0;
            mapData[w.fromY][w.fromX] = 0;

            let cell = cells[w.y * size + w.x];
            let fromCell = cells[w.fromY * size + w.fromX];
            cell.classList.remove('wall');
            fromCell.classList.remove('wall');

            if (w.y + 2 < size && mapData[w.y + 2][w.x] === 1) {
                walls.push({
                    y: w.y + 2,
                    x: w.x,
                    fromY: w.y + 1,
                    fromX: w.x
                });
            }
            if (w.y - 2 >= 0 && mapData[w.y - 2][w.x] === 1) {
                walls.push({
                    y: w.y - 2,
                    x: w.x,
                    fromY: w.y - 1,
                    fromX: w.x
                });
            }
            if (w.x + 2 < size && mapData[w.y][w.x + 2] === 1) {
                walls.push({
                    y: w.y,
                    x: w.x + 2,
                    fromY: w.y,
                    fromX: w.x + 1
                });
            }
            if (w.x - 2 >= 0 && mapData[w.y][w.x - 2] === 1) {
                walls.push({
                    y: w.y,
                    x: w.x - 2,
                    fromY: w.y,
                    fromX: w.x - 1
                });
            }
        }
    }

    for (let i = 0; i < size; i++) {
        if (Math.random() > 0.5) {
            mapData[i][size - 1] = 0;
            cells[i * size + size - 1].classList.remove('wall');
        }
        if (Math.random() > 0.5) {
            mapData[size - 1][i] = 0;
            cells[(size - 1) * size + i].classList.remove('wall');
        }
    }
}

function generateMap() {
    let size = parseInt(document.getElementById('mapSize').value);
    if (size > 100) {
        alert('Size should not be more than 100!');
        return;
    }
    let map = document.getElementById('map');
    map.innerHTML = '';
    mapData = [];
    document.getElementById('res').textContent = `${size}x${size} field`;
    
    let table = document.createElement('table');
    table.className = 'map-table';
    for (let i = 0; i < size; i++) {
        let row = [];
        let tableRow = document.createElement('tr');
        for (let j = 0; j < size; j++) {
            let cell = document.createElement('td');
            cell.className = 'cell';
            cell.onclick = () => handleClick(i, j);
            tableRow.appendChild(cell);
            row.push(0);
        }
        table.appendChild(tableRow);
        mapData.push(row);
    }
    map.appendChild(table);
    start = null, end = null;   
}

function handleClick(row, col) {
    clearPath();
    let cells = document.querySelectorAll('.cell');
    let i = row * mapData.length + col;
    let cell = cells[i];
    
    switch (mode) {
        case 'start':
            if (cell.classList.contains('end') || cell.classList.contains('wall')) return;
            let tmpStart = start;
            if (start) {
                start.classList.remove('start');
                mapData[Math.floor(Array.from(cells).indexOf(start) / mapData.length)]
                       [Array.from(cells).indexOf(start) % mapData.length] = 0;
            }
            if (cell !== tmpStart) {
                cell.classList.add('start');
                mapData[row][col] = 2;
                start = cell;
            }
            else start = null;
            break;
        case 'end':
            if (cell.classList.contains('start') || cell.classList.contains('wall')) return;
            let tmpEnd = end;
            if (end) {
                end.classList.remove('end');
                mapData[Math.floor(Array.from(cells).indexOf(start) / mapData.length)]
                       [Array.from(cells).indexOf(start) % mapData.length] = 0;
            }
            if (cell !== tmpEnd) {
                cell.classList.add('end');
                mapData[row][col] = 3;
                end = cell;
            }
            else end = null;
            break;
        case 'wall':
            if (cell.classList.contains('start') || cell.classList.contains('end')) return;
            cell.classList.toggle('wall');
            mapData[row][col] = cell.classList.contains('wall') ? 1 : 0;
            break;
    }
}

async function findPath() {
    clearPath();
    if (!start || !end) {
        document.getElementById('res').textContent = 'You should set both start and end positions!';
        return;
    }
    
    document.querySelector('button[onclick="findPath()"]').disabled = true;
    document.querySelector('button[onclick="clearPath()"]').disabled = true;
    document.querySelector('button[onclick="clearMap()"]').disabled = true;
    
    document.getElementById('res').textContent = 'Findin path in progres';
    let startPos = {
        row: Math.floor(Array.from(document.querySelectorAll('.cell')).indexOf(start) / mapData.length),
        col: Array.from(document.querySelectorAll('.cell')).indexOf(start) % mapData.length
    };
    let endPos = {
        row: Math.floor(Array.from(document.querySelectorAll('.cell')).indexOf(end) / mapData.length),
        col: Array.from(document.querySelectorAll('.cell')).indexOf(end) % mapData.length
    };
    let path = await bfs(startPos, endPos);
    if (path) document.getElementById('res').textContent = 'Path found!';
    else document.getElementById('res').textContent = 'Path not found!';
    
    document.querySelector('button[onclick="findPath()"]').disabled = false;
    document.querySelector('button[onclick="clearPath()"]').disabled = false;
    document.querySelector('button[onclick="clearMap()"]').disabled = false;
}

function clearPath() {
    let cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('path', 'considering', 'current', 'visited');           
    });
}

function clearMap() {
    let cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('start', 'end', 'wall', 'path', 'considering', 'visited', 'current');
        mapData[Math.floor(Array.from(cells).indexOf(cell) / mapData.length)]
               [Array.from(cells).indexOf(cell) % mapData.length] = 0;
    });
    mode = '';
    document.getElementById('mode').textContent = 'Selected Mode: None';
    document.getElementById('res').textContent = 'Map cleared';
    start = null, end = null;
}

function setStart() {
    clearPath();
    document.getElementById('mode').textContent = 'Selected Mode: Start Choice';
    mode = 'start';
}

function setEnd() {
    clearPath();
    document.getElementById('mode').textContent = 'Selected Mode: End Choice';
    mode = 'end';
}

function setWall() {
    clearPath();
    document.getElementById('mode').textContent = 'Selected Mode: Wall Choice';
    mode = 'wall';
}

window.onload = generateMap;