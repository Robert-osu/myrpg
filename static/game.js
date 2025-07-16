const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 32;
const MAP_SIZE = 32;  // Теперь карта 32x32

// Настройки камеры (ИЗМЕНЕНО)
let cameraOffset = { 
    x: -Math.floor(canvas.width / 2) + CELL_SIZE/2, 
    y: -Math.floor(canvas.height / 2) + CELL_SIZE/2
};




// Создаем текстуры для разных ресурсов
function createTexture(color, size) {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = textureCanvas.height = size;
    const texCtx = textureCanvas.getContext('2d');
    
    // Базовый цвет
    texCtx.fillStyle = color;
    texCtx.fillRect(0, 0, size, size);
    
    // Добавляем шум
    const imageData = texCtx.getImageData(0, 0, size, size);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Добавляем случайные вариации цвета
        const noise = Math.random() * 40 - 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise)); // R
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise)); // G
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise)); // B
    }
    
    texCtx.putImageData(imageData, 0, 0);
    return textureCanvas;
}

// Создаем текстуры для всех ресурсов
const RESOURCES = {
    none: { 
        color: '#ffffffff',
        texture: createTexture('#888888', CELL_SIZE),
        displayName: 'Камень' 
    },
    stone: {
        color: '#b87333',
        texture: createTexture('#b87333', CELL_SIZE),
        displayName: 'Руда'
    },
    ore: { 
        color: '#888888ff',
        texture: createTexture('#888888', CELL_SIZE),
        displayName: 'Камень' 
    },
    energy: {
        color: '#6233b8ff',
        texture: createTexture('#b87333', CELL_SIZE),
        displayName: 'Руда'
    }
    // ... остальные ресурсы
};


const socket = new WebSocket('ws://localhost:8000/ws');

// Обработка клавиш управления
document.addEventListener('keydown', (e) => {
    const directions = { 'w': 'up', 'a': 'left', 's': 'down', 'd': 'right' };
    if (directions[e.key]) {
        socket.send(JSON.stringify({ action: "move", direction: directions[e.key] }));
    } else if (e.key === ' ') {
        socket.send(JSON.stringify({ action: "collect" }));
    }
});


// Глобальные переменные
let lastServerState = null;
let currentRenderState = {
    player: { x: 0, y: 0 },
    map: Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill('none')),
    inventory: { stone: 0, ore: 0, energy: 0 }
};

// Основная функция интерполяции
function interpolateState(deltaTime) {
    if (!lastServerState) return;

    // Интерполяция позиции игрока с учетом зацикленности карты
    const lerpSpeed = 5.0; // Скорость интерполяции
    const mapSize = MAP_SIZE;
    
    // Вычисляем кратчайшее направление для X
    let dx = lastServerState.player.x - currentRenderState.player.x;
    if (Math.abs(dx) > mapSize / 2) {
        dx = dx > 0 ? dx - mapSize : dx + mapSize;
    }
    
    // Вычисляем кратчайшее направление для Y
    let dy = lastServerState.player.y - currentRenderState.player.y;
    if (Math.abs(dy) > mapSize / 2) {
        dy = dy > 0 ? dy - mapSize : dy + mapSize;
    }
    
    // Применяем интерполяцию
    currentRenderState.player.x += dx * lerpSpeed * deltaTime;
    currentRenderState.player.y += dy * lerpSpeed * deltaTime;
    
    // Нормализуем координаты
    currentRenderState.player.x = (currentRenderState.player.x + mapSize) % mapSize;
    currentRenderState.player.y = (currentRenderState.player.y + mapSize) % mapSize;
    
    // Копируем остальные данные
    currentRenderState.map = lastServerState.map;
    currentRenderState.inventory = lastServerState.inventory;
}

function drawCell(x, y, resource) {
    const size = CELL_SIZE;
    const padding = 2; // Величина неровностей
    
    // Случайные смещения углов
    const offsets = [
        { x: Math.random() * padding, y: Math.random() * padding },
        { x: size - Math.random() * padding, y: Math.random() * padding },
        { x: size - Math.random() * padding, y: size - Math.random() * padding },
        { x: Math.random() * padding, y: size - Math.random() * padding }
    ];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + offsets[0].x, y + offsets[0].y);
    ctx.lineTo(x + offsets[1].x, y + offsets[1].y);
    ctx.lineTo(x + offsets[2].x, y + offsets[2].y);
    ctx.lineTo(x + offsets[3].x, y + offsets[3].y);
    ctx.closePath();
    ctx.clip();

    // Заливка с текстурой
    ctx.fillStyle = RESOURCES[resource].color;
    ctx.fillRect(x, y, size, size);
    
    // Восстановление контекста
    ctx.restore();
    
    // Граница для контура
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    
}

function drawHexCell(x, y, resource) {
    const size = CELL_SIZE;
    const centerX = x + size/2;
    const centerY = y + size/2;
    
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI/3 * i;
        const px = centerX + size * 0.4 * Math.cos(angle);
        const py = centerY + size * 0.4 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    ctx.fillStyle = RESOURCES[resource].color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.stroke();
}

let animationPhase = 0;

function drawAnimatedCell(x, y, resource) {
    const size = CELL_SIZE;
    animationPhase += 0.01;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2 * (0.9 + Math.sin(animationPhase)*0.1), 0, Math.PI*2);
    ctx.fillStyle = RESOURCES[resource].color;
    ctx.fill();
    ctx.restore();
}

function drawTestCell(x, y, size, color, edges) {
    // edges: [top, right, bottom, left] - какие грани неровные (true/false)
    const ctx = canvas.getContext('2d');
    const variation = size * 0.15; // Максимальное отклонение края
    
    // Создаем форму ячейки
    ctx.beginPath();
    
    // Верхний край
    if (edges[0]) {
        ctx.moveTo(x + size * 0.2, y + Math.random() * variation);
        ctx.lineTo(x + size * 0.8, y + Math.random() * variation);
    } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
    }
    
    // Правый край
    if (edges[1]) {
        ctx.lineTo(x + size - Math.random() * variation, y + size * 0.2);
        ctx.lineTo(x + size - Math.random() * variation, y + size * 0.8);
    } else {
        ctx.lineTo(x + size, y + size);
    }
    
    // Нижний край
    if (edges[2]) {
        ctx.lineTo(x + size * 0.8, y + size - Math.random() * variation);
        ctx.lineTo(x + size * 0.2, y + size - Math.random() * variation);
    } else {
        ctx.lineTo(x, y + size);
    }
    
    // Левый край
    if (edges[3]) {
        ctx.lineTo(x + Math.random() * variation, y + size * 0.8);
        ctx.lineTo(x + Math.random() * variation, y + size * 0.2);
    } else {
        ctx.lineTo(x, y);
    }
    
    // Заливаем и обводим
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawOverlappingCell(x, y, size, color, overlapFactor = 0.2) {
    const ctx = canvas.getContext('2d');
    const overlap = size * overlapFactor; // Насколько сильно заезжает (20% от размера)
    
    // Случайные смещения для каждой стороны
    const topOverlap = Math.random() * overlap;
    const rightOverlap = Math.random() * overlap;
    const bottomOverlap = Math.random() * overlap;
    const leftOverlap = Math.random() * overlap;
    
    // Рисуем основную форму
    ctx.beginPath();
    ctx.moveTo(x - leftOverlap, y - topOverlap);
    ctx.lineTo(x + size + rightOverlap, y - topOverlap);
    ctx.lineTo(x + size + rightOverlap, y + size + bottomOverlap);
    ctx.lineTo(x - leftOverlap, y + size + bottomOverlap);
    ctx.closePath();
    
    // Заливка с прозрачностью
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Текстурирование
    ctx.save();
    ctx.clip(); // Обрезаем по форме ячейки
    for (let i = 0; i < 10; i++) {
        const nx = x + Math.random() * size;
        const ny = y + Math.random() * size;
        const radius = Math.random() * 3;
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(nx, ny, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // Обводка с эффектом объема
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Функция отрисовки
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Центрирование камеры на игроке
    const cameraX = -currentRenderState.player.x * CELL_SIZE + canvas.width / 2 - CELL_SIZE / 2;
    const cameraY = -currentRenderState.player.y * CELL_SIZE + canvas.height / 2 - CELL_SIZE / 2;
    
    // Рассчитываем видимую область
    const startCol = Math.floor(-cameraX / CELL_SIZE);
    const startRow = Math.floor(-cameraY / CELL_SIZE);
    const visibleCols = Math.ceil(canvas.width / CELL_SIZE) + 2;
    const visibleRows = Math.ceil(canvas.height / CELL_SIZE) + 2;
    
    // Отрисовываем карту с учетом зацикленности
    for (let row = 0; row < visibleRows; row++) {
        for (let col = 0; col < visibleCols; col++) {
            const mapX = (startCol + col + MAP_SIZE) % MAP_SIZE;
            const mapY = (startRow + row + MAP_SIZE) % MAP_SIZE;
            
            const resource = currentRenderState.map[mapY][mapX];
            if (RESOURCES[resource]) {
                // ctx.fillStyle = RESOURCES[resource].color;
                // ctx.fillRect(
                //     (startCol + col) * CELL_SIZE + cameraX,
                //     (startRow + row) * CELL_SIZE + cameraY,
                //     CELL_SIZE,
                //     CELL_SIZE
                // );
                // drawAnimatedCell((startCol + col) * CELL_SIZE + cameraX, 
                //     (startRow + row) * CELL_SIZE + cameraY, resource)
                drawOverlappingCell((startCol + col) * CELL_SIZE + cameraX, 
                (startRow + row) * CELL_SIZE + cameraY, CELL_SIZE, '#888888', 0.01);
            }
        }
    }

    
    
    // Отрисовываем игрока (в центре экрана)
    ctx.fillStyle = 'blue';
    ctx.fillRect(
        canvas.width / 2 - CELL_SIZE / 2,
        canvas.height / 2 - CELL_SIZE / 2,
        CELL_SIZE,
        CELL_SIZE
    );
}

// Игровой цикл
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    interpolateState(deltaTime);
    drawGame();
    
    requestAnimationFrame(gameLoop);
}

// Обработка сообщений от сервера
socket.onmessage = (event) => {
    lastServerState = JSON.parse(event.data);
    
    // Обновляем инвентарь сразу
    const inv = JSON.parse(lastServerState.inventory);
    document.getElementById('inventory').innerText = 
        `Инвентарь: Камень: ${inv.stone}, Руда: ${inv.ore}, Энергия: ${inv.energy}`;
};

// Запуск игры
requestAnimationFrame(gameLoop);