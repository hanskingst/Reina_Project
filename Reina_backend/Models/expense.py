from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ExpenseCreate(BaseModel):
    amount:float
    Date:date
    category:str

class ExpenseUpdate(BaseModel):
    amount:Optional[float] = None
    Date:Optional[date] = None
    category:Optional[str] =None

class ExpenseResponse(BaseModel):
    expense_id:int
    user_id:int
    amount:float
    date:date
    category:str
    created_at:datetime
    
    class Config:
        from_attributes: True

    