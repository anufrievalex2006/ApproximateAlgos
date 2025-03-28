let mode = '';
let start = null, end = null;
let mapData = [];

function findPath(start, end) {
    let queue = [[start]], isVisited = new Set();
    let key = pos => `${pos.row},${pos.col}`;
    isVisited.add(key(start));
    
    while (queue.length > 0) {
        let path = queue.shift();
        let cur = path[path.length - 1];
        
        if (cur.row == end.row && cur.col == end.col) return path;
        
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
                mapData[newY][newX] !== 1 && !isVisited.has(key({row: newY, col: newX}))) {
                let newPath = [...path, {row: newY, col: newX}];
                queue.push(newPath);
                isVisited.add(key({row: newY, col: newX}));
            }
        }
    }
    return null;
}

function generateMap() {
    let size = parseInt(document.getElementById('mapSize').value);
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
}

function handleClick(row, col) {
    clearPath();
    let cells = document.querySelectorAll('.cell');
    let i = row * mapData.length + col;
    let cell = cells[i];
    
    switch (mode) {
        case 'start':
            if (cell.classList.contains('end') || cell.classList.contains('wall')) return;
            if (start) {
                start.classList.remove('start');
                mapData[Math.floor(Array.from(cells).indexOf(start) / mapData.length)]
                       [Array.from(cells).indexOf(start) % mapData.length] = 0;
            }
            cell.classList.add('start');
            mapData[row][col] = 2;
            start = cell;
            break;
        case 'end':
            if (cell.classList.contains('start') || cell.classList.contains('wall')) return;
            if (end) {
                end.classList.remove('end');
                mapData[Math.floor(Array.from(cells).indexOf(start) / mapData.length)]
                       [Array.from(cells).indexOf(start) % mapData.length] = 0;
            }
            cell.classList.add('end');
            mapData[row][col] = 3;
            end = cell;
            break;
        case 'wall':
            if (cell.classList.contains('start') || cell.classList.contains('end')) return;
            cell.classList.add('wall');
            mapData[row][col] = 1;
            break;
        case 'clear':
            cell.className = 'cell';
            mapData[row][col] = 0;
            if (cell === start) start = null;
            if (cell === end) end = null;
            break;
    }
}

function findPath() {
    if (!start || !end) {
        document.getElementById('res').textContent = 'You should set both start and end positions!';
        return;
    }
    let startPos = {
        row: Math.floor(Array.from(document.querySelectorAll('.cell')).indexOf(start) / mapData.length),
        col: Array.from(document.querySelectorAll('.cell')).indexOf(start) % mapData.length
    };
    let endPos = {
        row: Math.floor(Array.from(document.querySelectorAll('.cell')).indexOf(end) / mapData.length),
        col: Array.from(document.querySelectorAll('.cell')).indexOf(end) % mapData.length
    };
    let path = findPath(startPos, endPos);
    if (path) {
        visualizePath(path);
        document.getElementById('res').textContent = 'Path found!';
    }
    else document.getElementById('res').textContent = 'Path not found!';
}

function visualizePath(path) {
    let cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
       if (cell.classList.contains('path'))
           cell.classList.remove('path');
    });
    for (let i = 1; i < path.length - 1; i++) {
        let id = path[i].row * mapData.length + path[i].col;
        cells[id].classList.add('path');
    }
}

function clearPath() {
    let cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (cell.classList.contains('path')) cell.classList.remove('path');           
    });
}

function clearMap() {
    let cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.classList.remove('start', 'end', 'wall', 'path');
        mapData[Math.floor(Array.from(cells).indexOf(cell) / mapData.length)]
               [Array.from(cells).indexOf(cell) % mapData.length] = 0;
    });
    mode = '';
    document.getElementById('mode').textContent = 'Selected Mode: None';
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

function clearCell() {
    clearPath();
    document.getElementById('mode').textContent = 'Selected Mode: Cell Clear';
    mode = 'clear';
}

window.onload = generateMap;