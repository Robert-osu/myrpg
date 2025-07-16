# database/repository.py
from typing import Type, TypeVar
from sqlalchemy.orm import Session

T = TypeVar('T')

class BaseRepository:
    @staticmethod
    def get_or_create(db: Session, model: Type[T], **kwargs) -> T:
        """Получает первую запись или создает новую"""
        instance = db.query(model).first()
        if not instance:
            instance = model(**kwargs)
            db.add(instance)
            db.commit()
        return instance

    @staticmethod
    def update(db: Session, instance: T) -> None:
        """Обновляет сущность"""
        db.commit()