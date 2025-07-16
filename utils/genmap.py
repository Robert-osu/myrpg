from random import randint, shuffle
from typing import List, Dict, Callable
from enum import Enum

MAP_SIZE = 32

resources = ['none', 'stone', 'ore', 'energy']


class DistributionType(Enum):
    """Типы распределения весов"""
    DECREASING = "decreasing"    # Убывающее (первый ресурс самый частый)
    INCREASING = "increasing"    # Возрастающее (последний ресурс самый частый)
    UNIFORM = "uniform"          # Равномерное распределение
    MID_PEAK = "mid_peak"        # Пик в середине списка
    END_PEAK = "end_peak"        # Пик в конце списка
    START_PEAK = "start_peak"    # Пик в начале списка
    RANDOM = "random"            # Случайные веса

class WeightGenerator:
    @staticmethod
    def generate_weights(num_items: int, dist_type: DistributionType) -> List[int]:
        """
        Генерирует веса согласно заданному распределению
        
        :param num_items: Количество элементов для генерации весов
        :param dist_type: Тип распределения (из enum DistributionType)
        :return: Список весов
        """
        generators: Dict[DistributionType, Callable[[int], List[int]]] = {
            DistributionType.DECREASING: WeightGenerator._decreasing,
            DistributionType.INCREASING: WeightGenerator._increasing,
            DistributionType.UNIFORM: WeightGenerator._uniform,
            DistributionType.MID_PEAK: WeightGenerator._mid_peak,
            DistributionType.END_PEAK: WeightGenerator._end_peak,
            DistributionType.START_PEAK: WeightGenerator._start_peak,
            DistributionType.RANDOM: WeightGenerator._random,
        }
        
        if dist_type not in generators:
            raise ValueError(f"Unknown distribution type: {dist_type}")
            
        return generators[dist_type](num_items)
    
    @staticmethod
    def _decreasing(n: int) -> List[int]:
        """Убывающее распределение (первый элемент имеет наибольший вес)"""
        return [3 ** (n - i) for i in range(n)]
    
    @staticmethod
    def _increasing(n: int) -> List[int]:
        """Возрастающее распределение (последний элемент имеет наибольший вес)"""
        return [i + 1 for i in range(n)]
    
    @staticmethod
    def _uniform(n: int) -> List[int]:
        """Равномерное распределение (все веса одинаковые)"""
        return [10] * n  # Можно использовать любое фиксированное значение
    
    @staticmethod
    def _mid_peak(n: int) -> List[int]:
        """Пик в середине списка"""
        mid = n // 2
        return [abs(mid - i) + 1 for i in range(n)]
    
    @staticmethod
    def _end_peak(n: int) -> List[int]:
        """Пик в конце списка"""
        return [1 + i * 2 for i in range(n)]
    
    @staticmethod
    def _start_peak(n: int) -> List[int]:
        """Пик в начале списка"""
        return [1 + (n - i) * 2 for i in range(n)]
    
    @staticmethod
    def _random(n: int) -> List[int]:
        """Случайные веса"""
        from random import randint
        return [randint(1, 10) for _ in range(n)]

class MapFactory:
    @staticmethod
    def create_map(map_type: str, dist_type: DistributionType = DistributionType.DECREASING) -> List[List[str]]:
        """
        Создает карту по заданному типу с указанным распределением весов.
        """
        # Базовые параметры (можно адаптировать)
        base_params = {
            'default': {'size': MAP_SIZE * MAP_SIZE},
            'rich': {'size': MAP_SIZE * MAP_SIZE},
            'poor': {'size': MAP_SIZE * MAP_SIZE}
        }
        
        if map_type not in base_params:
            raise ValueError(f"Unknown map type: {map_type}")
            
        # Генерируем веса согласно выбранному распределению
        weights = WeightGenerator.generate_weights(len(resources), dist_type)
        
        return MapFactory._generate_map(
            num_objects=len(resources),
            size=base_params[map_type]['size'],
            weights=weights
        )
    
    @staticmethod
    def _generate_map(num_objects: int, size: int, weights: List[int]) -> List[List[str]]:
        """Улучшенный метод генерации карты с гарантированным распределением"""
        # 1. Нормализуем веса, чтобы их сумма была равна size
        total_weight = max(sum(weights), 1)  # Защита от деления на 0
        normalized = [max(1, int((w / total_weight) * size)) for w in weights]
        
        # 2. Корректируем сумму (может отличаться из-за округления)
        diff = size - sum(normalized)
        if diff > 0:
            # Добавляем к самым тяжелым весам
            normalized[-1] += diff
        elif diff < 0:
            # Убираем из самых тяжелых весов
            normalized[-1] = max(1, normalized[-1] + diff)
        
        # 3. Генерируем базовое распределение
        result = []
        for i in range(num_objects):
            result += [i] * normalized[i]
        
        # 4. Добавляем случайные элементы если нужно (защита)
        while len(result) < size:
            result.append(randint(0, num_objects - 1))
        
        # 5. Перемешиваем и формируем карту
        shuffle(result)
        
        # 6. Преобразуем индексы в ресурсы
        resource_list = [resources[i] for i in result]
        
        # 7. Разбиваем на строки карты
        return [resource_list[i*MAP_SIZE : (i+1)*MAP_SIZE] for i in range(MAP_SIZE)]


# Примеры использования
if __name__ == "__main__":
    # Карта с убывающим распределением (по умолчанию)
    default_map = MapFactory.create_map('default')
    
    # Карта с возрастающим распределением ресурсов
    increasing_map = MapFactory.create_map('rich', DistributionType.INCREASING)
    
    # Карта с пиком в середине
    mid_peak_map = MapFactory.create_map('default', DistributionType.MID_PEAK)
    
    # Карта со случайным распределением
    random_map = MapFactory.create_map('poor', DistributionType.RANDOM)