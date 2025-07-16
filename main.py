from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import uvicorn
from utils.genmap import MapFactory, MAP_SIZE
from utils.player_actions import handle_player_action
from models.models import Player
from database.db_utils import get_db_session
from database.repository import BaseRepository

# Инициализация игры
game_map = MapFactory.create_map('default')  # Карта с параметрами по умолчанию

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    with get_db_session() as db:
        # Используем репозиторий для работы с сущностями
        player = BaseRepository.get_or_create(db, Player, x=0, y=0)
        
        try:
            while True:
                game_state = {
                    "player": {"x": player.x, "y": player.y},
                    "inventory": player.inventory,
                    "map": game_map
                }
                await websocket.send_json(game_state)
                
                data = await websocket.receive_json()
                handle_player_action(player, game_map, data, MAP_SIZE)
                
                # Теперь commit происходит автоматически в get_db_session()
                
        except WebSocketDisconnect:
            pass  # Сессия закроется автоматически

app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)