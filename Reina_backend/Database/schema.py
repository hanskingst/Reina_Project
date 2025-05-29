from sqlalchemy import Column, Integer, Boolean, ForeignKey, String,Numeric,Date,DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from .db import Base

class User(Base):
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True,autoincrement=True)
    user_name = Column(String(50),unique=True, nullable=False,index=True)
    email = Column(String(50), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    net_income = Column(Numeric(10,2),nullable=True)
    refresh_token = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.now(), nullable=True)
    
    expenses = relationship('Expense', back_populates='user', cascade='all, delete')
    notifications = relationship('Notification', back_populates='user', cascade='all, delete')

class Expense(Base):
    __tablename__ = 'expenses'
    expense_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id  = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10,2), nullable=False)
    category = Column(String(20), nullable=False)
    date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.now(), nullable=False)
    
    user = relationship('User',back_populates='expenses')

class Notification(Base):
    __tablename__ = 'notifications'
    notification_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.now(), nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    
    user = relationship('User', back_populates='notifications')