# player_actions.py
import json

def handle_player_action(player, game_map, data, MAP_SIZE):
    """Основная функция для обработки действий игрока"""
    if data["action"] == "move":
        handle_move(player, data, MAP_SIZE)
    elif data["action"] == "collect":
        handle_collect(player, game_map)

def handle_move(player, data, MAP_SIZE):
    """Обработка движения игрока"""
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

def handle_collect(player, game_map):
    """Обработка сбора ресурсов игроком"""
    resource = game_map[player.y][player.x]
    if resource and resource != 'none':
        inv = json.loads(player.inventory)
        inv[resource] = inv.get(resource, 0) + 1
        player.inventory = json.dumps(inv)
        game_map[player.y][player.x] = 'none'  # Ресурс исчерпан