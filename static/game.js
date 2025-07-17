const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 32;
const MAP_SIZE = 32;  // Теперь карта 32x32

// Настройки камеры (ИЗМЕНЕНО)
let cameraOffset = { 
    x: -Math.floor(canvas.width / 2) + CELL_SIZE/2, 
    y: -Math.floor(canvas.height / 2) + CELL_SIZE/2
};




// Создаем текстуры для всех ресурсов
const RESOURCES = {
    none: { 
        color: '#ffffffff',
        displayName: 'Камень' 
    },
    stone: {
        color: '#b87333',
        displayName: 'Руда'
    },
    ore: { 
        color: '#888888ff',
        displayName: 'Камень' 
    },
    energy: {
        color: '#6233b8ff',
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
        switch(e.key) {
            case 'w':
                break;
            case 'a':
                break;
            case 's':
                break;
            case 'd':
                break;
            default:
                break;
        }
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

function drawCell(x, y, color) {
    const size = CELL_SIZE;

    // Заливка с текстурой
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
    
    // Восстановление контекста
    ctx.restore();
    
    // Граница для контура
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    
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
                drawCell(   (startCol + col) * CELL_SIZE + cameraX,
                            (startRow + row) * CELL_SIZE + cameraY,
                            RESOURCES[resource].color
                )
            }
        }
    }

    
    
    // Отрисовываем игрока (в центре экрана)
    ctx.fillStyle = '#46887aff';
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