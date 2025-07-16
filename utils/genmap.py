from random import randint, shuffle

resources = ['stone', 'ore', 'energy']

def map_list(num_objects=10, size=1024, weights=None):
    if weights is None:
        # По умолчанию делаем первые 3 числа более вероятными
        weights = [5, 3, 2] + [1] * (num_objects - 3)  # Остальные — с весом 1
    else:
        # Если weights задан вручную, но он короче num_objects — дополняем 1
        if len(weights) < num_objects:
            weights += [1] * (num_objects - len(weights))
    
    # Нормализуем веса
    total_weight = sum(weights)
    normalized_weights = [int((w / total_weight) * size) for w in weights]
    
    # Создаём список
    result = []
    for i in range(num_objects):
        result += [i] * normalized_weights[i]
    
    # Корректируем размер (из-за округлений int())
    while len(result) < size:
        result.append(randint(0, num_objects - 1))
    while len(result) > size:
        result.pop()
    
    shuffle(result)  # Перемешиваем
    return result