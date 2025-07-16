const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 20;
const MAP_SIZE = 32;  // Теперь карта 32x32

// Настройки камеры
let cameraOffset = { x: 0, y: 0 };
const PLAYER_SCREEN_X = Math.floor(canvas.width / 2 / CELL_SIZE);  // Центр экрана по X
const PLAYER_SCREEN_Y = Math.floor(canvas.height / 2 / CELL_SIZE);  // Центр экрана по Y

// Ресурсы и их цвета (легко расширяемо)
const RESOURCES = {
    none:  { color: 'white',   displayName: 'empty' },  // Пример нового ресурса
    stone: { color: 'gray',   displayName: 'Камень' },
    ore:   { color: 'brown',  displayName: 'Руда' },
    energy: { color: 'yellow', displayName: 'Энергия' },
    wood:  { color: 'green',  displayName: 'Дерево' },  // Пример нового ресурса
};

let gameState = {};
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

// Отрисовка игры
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Смещение камеры (игрок в центре)
    cameraOffset.x = PLAYER_SCREEN_X - gameState.player.x;
    cameraOffset.y = PLAYER_SCREEN_Y - gameState.player.y;

    // Видимая область в координатах карты
    const startX = Math.floor(-cameraOffset.x);
    const startY = Math.floor(-cameraOffset.y);
    const endX = startX + Math.ceil(canvas.width / CELL_SIZE) + 1;
    const endY = startY + Math.ceil(canvas.height / CELL_SIZE) + 1;

    // Отрисовка с учётом зацикленности
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            // Применяем модуль для зацикленности
            const mapX = (x + MAP_SIZE) % MAP_SIZE;
            const mapY = (y + MAP_SIZE) % MAP_SIZE;
            
            const resource = gameState.map[mapY][mapX];
            if (resource && RESOURCES[resource]) {
                ctx.fillStyle = RESOURCES[resource].color;
                ctx.fillRect(
                    (x + cameraOffset.x) * CELL_SIZE,
                    (y + cameraOffset.y) * CELL_SIZE,
                    CELL_SIZE,
                    CELL_SIZE
                );
            }
        }
    }

    // Игрок (в центре экрана)
    ctx.fillStyle = 'blue';
    ctx.fillRect(
        PLAYER_SCREEN_X * CELL_SIZE,
        PLAYER_SCREEN_Y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    );
}

// Обновление интерфейса
socket.onmessage = (event) => {
    gameState = JSON.parse(event.data);
    drawGame();
    
    // Обновление инвентаря
    const inv = JSON.parse(gameState.inventory);
    document.getElementById('inventory').innerText = 
        `Инвентарь: Камень: ${inv.stone}, Руда: ${inv.ore}, Энергия: ${inv.energy}`;
};