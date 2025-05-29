from pydantic import BaseModel,Field,EmailStr
from typing import Optional
from datetime import date, datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=5,)
    email: EmailStr = Field(..., max_length=30)
    password:str = Field(...,min_length=8)
    net_income:Optional[float] = None

class UserUpdate(BaseModel):
    net_income : Optional[float] = None

class Token(BaseModel):
    access_token:str
    refresh_token:str
    token_type:str

class UserResponse(BaseModel):
    user_id: int
    user_name:str
    email:EmailStr
    net_income:Optional[float]
    created_at:datetime
        
    class Config:
        from_attributes = True