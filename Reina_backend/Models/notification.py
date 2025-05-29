from pydantic import BaseModel,Field
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    message: str = Field(..., max_length=200)
    is_read:bool = False
    

class NotificationUpdate(BaseModel):
    is_read:Optional[bool] = None
    
class NotificationResponse(BaseModel):
    notification_id:int
    user_id:int
    message: str 
    is_read:bool = False
    created_at:datetime
    
    class Config:
        from_attributes = True