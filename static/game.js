const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CELL_SIZE = 20;
const MAP_SIZE = 20;

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
    
    // Отрисовка карты
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const resource = gameState.map[y][x];
            if (resource) {
                ctx.fillStyle = 
                    resource === 'stone' ? 'gray' :
                    resource === 'ore' ? 'brown' : 'yellow';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    // Отрисовка игрока
    ctx.fillStyle = 'blue';
    ctx.fillRect(
        gameState.player.x * CELL_SIZE,
        gameState.player.y * CELL_SIZE,
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