# models.py
from sqlalchemy import Column, Integer, String
from database.db_utils import Base

class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)
    inventory = Column(String, default='{"stone": 0, "ore": 0, "energy": 0}')

# Другие модели (если будут)
# class Enemy(Base):
#     __tablename__ = "enemies"
#     id = Column(Integer, primary_key=True)
#     x = Column(Integer)
#     y = Column(Integer)