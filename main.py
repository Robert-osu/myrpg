from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import random
import uvicorn
from utils.genmap import map_list

# Настройка базы данных SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./game.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
Base = declarative_base()

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)
    inventory = Column(String, default='{"stone": 0, "ore": 0, "energy": 0}')

Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Инициализация игры
MAP_SIZE = 32
resources = ['none', 'stone', 'ore', 'energy']

# Предположим, у вас есть список длиной 1024
indices = map_list(len(resources), MAP_SIZE * MAP_SIZE, [10, 5, 2, 1])

# Преобразуем индексы в ресурсы
resource_list = [resources[i] for i in indices]

# Преобразование плоского списка в двумерную карту 32x32
game_map = [resource_list[i*MAP_SIZE : (i+1)*MAP_SIZE] for i in range(MAP_SIZE)]
#game_map = [[random.choice(resources) if random.random() > 0.7 else None for _ in range(MAP_SIZE)] for _ in range(MAP_SIZE)]

app = FastAPI()

# WebSocket для онлайн-взаимодействия
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()
    player = db.query(Player).first()
    
    if not player:
        player = Player(x=0, y=0)
        db.add(player)
        db.commit()
    
    try:
        while True:
            # Отправляем состояние игры
            game_state = {
                "player": {"x": player.x, "y": player.y},
                "inventory": player.inventory,
                "map": game_map
            }
            await websocket.send_json(game_state)
            
            # Обрабатываем действия игрока
            data = await websocket.receive_json()
            
            if data["action"] == "move":
                new_x, new_y = player.x, player.y
                
                if data["direction"] == "up": 
                    new_y = (new_y - 1) % MAP_SIZE
                elif data["direction"] == "down": 
                    new_y = (new_y + 1) % MAP_SIZE
                elif data["direction"] == "left": 
                    new_x = (new_x - 1) % MAP_SIZE
                elif data["direction"] == "right": 
                    new_x = (new_x + 1) % MAP_SIZE
                
                player.x, player.y = new_x, new_y
            
            elif data["action"] == "collect":
                resource = game_map[player.y][player.x]
                if resource and resource != 'none':
                    import json
                    inv = json.loads(player.inventory)
                    inv[resource] = inv.get(resource, 0) + 1
                    player.inventory = json.dumps(inv)
                    game_map[player.y][player.x] = 'none'  # Ресурс исчерпан
            
            db.commit()
    except WebSocketDisconnect:
        db.close()

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)