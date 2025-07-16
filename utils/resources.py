# resources.py
from typing import List, Dict
import json
from .genmap import map_list

class ResourceManager:
    def __init__(self, map_size: int = 32):
        self.MAP_SIZE = map_size
        self.resource_types = ['none', 'stone', 'ore', 'energy']
        self.resource_weights = [10, 5, 2, 1]  # Веса для генерации карты
        
        # Инициализация карты ресурсов
        indices = map_list(len(self.resource_types), self.MAP_SIZE * self.MAP_SIZE, self.resource_weights)
        resource_list = [self.resource_types[i] for i in indices]
        self.game_map = [resource_list[i*self.MAP_SIZE : (i+1)*self.MAP_SIZE] 
                        for i in range(self.MAP_SIZE)]
    
    def get_resource_at(self, x: int, y: int) -> str:
        """Получить ресурс на указанных координатах"""
        return self.game_map[y][x]
    
    def collect_resource(self, x: int, y: int) -> str:
        """Собрать ресурс на указанных координатах и вернуть его тип"""
        resource = self.game_map[y][x]
        if resource and resource != 'none':
            self.game_map[y][x] = 'none'
        return resource
    
    def get_map_slice(self, center_x: int, center_y: int, radius: int = 5) -> List[List[str]]:
        """Получить часть карты вокруг указанных координат"""
        map_slice = []
        for dy in range(-radius, radius + 1):
            row = []
            for dx in range(-radius, radius + 1):
                x = (center_x + dx) % self.MAP_SIZE
                y = (center_y + dy) % self.MAP_SIZE
                row.append(self.game_map[y][x])
            map_slice.append(row)
        return map_slice
    
    @staticmethod
    def update_inventory(inventory: str, resource: str) -> str:
        """Обновить инвентарь после сбора ресурса"""
        if resource == 'none':
            return inventory
        
        inv = json.loads(inventory)
        inv[resource] = inv.get(resource, 0) + 1
        return json.dumps(inv)