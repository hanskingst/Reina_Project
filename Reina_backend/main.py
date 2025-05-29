from fastapi import FastAPI,Depends,status,HTTPException,Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError,jwt
from Database import db,schema
from Models import user, expense,notification
from typing import List,Annotated,Optional,Dict
from passlib.context import CryptContext
from datetime import datetime, timedelta,date
from sqlalchemy import func
from sqlalchemy.orm import Session
from config import SECRET_KEY,ALGORITHM,ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI()

db.Base.metadata.create_all(bind=db.engine)

origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

db_dependency = Annotated[Session,Depends(db.get_db)]

pwd_context = CryptContext(schemes=['bcrypt'], deprecated = 'auto')

Oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/login')

REQUEST_TOKEN_EXPIRE_DAY = 7

def hashPassword(plain_password):
   return pwd_context.hash(plain_password)

def verifyPassword(plain_password, hashed_password):
   return pwd_context.verify(plain_password,hashed_password)


def create_access_token(data:dict, expires_delta:Optional[timedelta] = None):
    data_to_encode = data.copy()
    if expires_delta:
        expire_time = datetime.now() + expires_delta
    else:
        expire_time = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    data_to_encode.update({'exp':expire_time})
    
    encoded_data = jwt.encode(data_to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_data

def create_refresh_token(data:dict, expire_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expire_delta:
        expire = datetime.now() + expire_delta
    else:
        expire = datetime.now() + timedelta(minutes=REQUEST_TOKEN_EXPIRE_DAY)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(db:db_dependency, token : str = Depends(Oauth2_scheme)):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate":"Bearer"}
    )
    try:
       payload = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
       user_name : str = payload.get("sub")
       
       if user_name is None:
           raise credential_exception
    except JWTError:
        raise credential_exception
    user = db.query(schema.User).filter(schema.User.user_name == user_name).first()
    
    if user is None:
        raise credential_exception
    return user

@app.post('/refresh', response_model=user.Token)
async def refresh_token(refresh_token:str, db:db_dependency):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate":"Bearer"}
    )
    try:
       payload = jwt.decode(refresh_token,SECRET_KEY,algorithms=ALGORITHM)
    
       user_name = payload.get("sub")
       if user_name is None:
        raise credential_exception
    except JWTError:
        raise credential_exception
    user = db.query(schema.User).filter(schema.User.user_name== user_name).first()
    if user is None or schema.User.refresh_token != refresh_token:
        raise credential_exception
    access_token = create_access_token(data={"sub":user.user_name}, expires_delta=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_refresh_token = create_refresh_token(data={"sub":user.user_name})
    user.refresh_token = new_refresh_token
    db.commit()
    return {"access_token":access_token, "refresh_token":new_refresh_token, "token_type":"bearer"}

@app.post('/signup',response_model=user.UserResponse)
async def create_user(user:user.UserCreate, db:db_dependency):
    db_user = db.query(schema.User).filter(schema.User.user_name == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exist")
    hashed_password = hashPassword(user.password)
    db_user = schema.User(user_name = user.username, email = user.email ,hashed_password = hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

    
@app.post('/login',response_model=user.Token)
async def user_registration(db:db_dependency, form_data:OAuth2PasswordRequestForm = Depends()):
    user = db.query(schema.User).filter(schema.User.user_name == form_data.username).first()
    if not user or not verifyPassword(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="invalid credentials",
            headers={"WWW-Authenticate":"Bearer"}
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub":form_data.username}, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data={"sub":user.user_name})
    user.refresh_token = refresh_token
    db.commit()
    return {"access_token":access_token,"refresh_token":refresh_token, "token_type":"bearer"}

@app.put('/update_income', response_model=user.UserResponse)
async def Update_net_income(income:user.UserUpdate, db:db_dependency,current_user: schema.User = Depends(get_current_user)):
    db_user = db.query(schema.User).filter(schema.User.user_id == current_user.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404,detail="user not found")
    db_user.net_income = income.net_income
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get('/me',response_model=user.UserResponse)
async def get_current_user_endpoint(current_user: schema.User = Depends(get_current_user)):
    return current_user

@app.post("/expenses", response_model=expense.ExpenseResponse)
async def create_expense(expense_data:expense.ExpenseCreate, db:db_dependency ,current_user:schema.User = Depends(get_current_user)):
    
    if expense_data.amount <0:
        raise HTTPException(status_code=422, detail="Amount must be positive")
    if not expense_data.category in ['Food','Savings','Health', 'Education', 'Transport','Clothing']:
        raise HTTPException(status_code=422, detail="Category is invalid")
    if expense_data.Date > datetime.now():
        raise HTTPException(status_code=422,detail="Date can not be ahead of the current date")
    
    db_user = db.query(schema.User).filter(schema.User.user_id == current_user.user_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not existing")
    
    new_expense = schema.Expense(user_id = current_user.user_id,amount = expense_data.amount, category = expense_data.category, date = expense_data.Date)
    
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    
    return new_expense

@app.get("/expenses", response_model=Dict)
async def get_expense(db:db_dependency,
        page:int = Query(1,ge=1),
        limit:int = Query(5,ge=1, 
        le=100), 
        current_user: schema.User = Depends(get_current_user),
        category:str = Query(None),
        chart_type:str = Query(None, regex="^(bar|line|pie)$")
        ):
    query = db.query(schema.Expense).filter(schema.Expense.user_id == current_user.user_id)
    
    if category:
        query = query.filter(schema.Expense.category == category)
    
    total = query.count()
    offset = (page - 1) * limit
    expenses = query.offset(offset).limit(limit).all()
    
    response = {
        "items":[expense.ExpenseResponse.model_validate(exp) for exp in expenses],
        "total":total,
        "limit":limit,
        "page":page
    }
    
    if chart_type:
        if chart_type == "bar":
            chart_data = db.query(schema.Expense.category, 
                func.week(schema.Expense.created_at).label("week"), 
                schema.Expense.amount).filter(schema.Expense.user_id == current_user.user_id).all()
            response["chart"] = [{"category":c,"amount":a,"week":w} for c,a,w in chart_data]
        elif chart_type == "line":
            chart_data = db.query(schema.Expense.category,
                func.date(schema.Expense.created_at).label("date"), 
                func.sum(schema.Expense.amount).label("total_amount")).filter(schema.Expense.user_id == current_user.user_id,
                func.date(schema.Expense.created_at) == date.today()
                ).group_by(schema.Expense.category,func.date(schema.Expense.created_at)).all()
            response["chart"] = [{"category":c,"date":d.isoformat(),"total_amount":t} for c,d,t in chart_data]
        elif chart_type == "pie":
            total_amount = db.query(func.sum(schema.Expense.amount)).filter(schema.Expense.user_id == current_user.user_id,
            func.date(schema.Expense.created_at) == date.today()).scalar or 0
            if total_amount == 0:
                response["chart"] = []
            else:
                chart_data = db.query(schema.Expense.category, func.sum(schema.Expense.amount).label("category_total")
                ).filter(schema.Expense.user_id == current_user.user_id,func.date(schema.Expense.created_at )== date.today()
                    ).group_by(schema.Expense.category).all()
                response["chart"] = [{"category":c,"percentage":round((ct/total_amount) * 100,2)} for c,ct in chart_data]
                
    return response
              


@app.put("/expense/{current_expense_id}", response_model=expense.ExpenseResponse)
async def updata_expense(db:db_dependency,expense_data:expense.ExpenseUpdate, current_expense_id:int, current_user: schema.User = Depends(get_current_user)):
    
    db_expense = db.query(schema.Expense).filter(schema.Expense.expense_id == current_expense_id).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="No expense found")
    
    if db_expense.user_id != current_user.user_id:
        raise HTTPException(status_code=403,detail="User is not authorized to update this expense")
    
    if expense_data.amount is not None:
        if expense_data.amount <0:
            raise HTTPException(status_code=422, detail="Amount must be positive")
        if current_user.net_income is not None or expense_data.amount > current_user.net_income:
            return {"status":"insufficient_funds", "notify":True, "message":"Updated amount exceded net income"}
        
    update = expense_data.model_dump(exclude_unset=True)
    for key,value in update.items():
        if key in ["amount","Date","category"]:
            setattr(db_expense,key,value)
    if not update:
        return db_expense
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{expense_id}", status_code=200)
async def delete_expense(db:db_dependency, expense_id:int, current_user: schema.User = Depends(get_current_user)):
    db_expense = db.query(schema.Expense).filter(schema.Expense.expense_id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if db_expense.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="User not authorized to delete this expense")
    db.delete(db_expense)
    
    db.commit()
    
    return {"status":"deleted","message":f"expense {expense_id} successfully deleted "}


@app.post('/notification', response_model=notification.NotificationResponse)
async def create_notification(db:db_dependency, 
    new_notification:notification.NotificationCreate = None, 
    current_user: schema.User = Depends(get_current_user) ):
    
    new_notification_create = schema.Notification(
        user_id = current_user.user_id,
        message = new_notification.message if new_notification else "System default",
        is_read = False
    )
    
    db.add(new_notification_create)
    db.commit()
    db.refresh(new_notification_create)
    
    return new_notification_create

@app.put('/notification/{notification_id}', response_model=notification.NotificationResponse)
async def update_notification(db:db_dependency, 
        notification_id:int, 
        current_user:schema.User = Depends(get_current_user)):
    db_notification = db.query(schema.Notification).filter(schema.Notification.notification_id== notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="no notifications found")
    
    if db_notification.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="User not authorized to update this notification")
    
    db_notification.is_read = True
    
    db.commit()
    db.refresh(db_notification)
    return db_notification

@app.get('/notifications', response_model=Dict)
async def get_notifications(db:db_dependency, current_user: schema.User = Depends(get_current_user)):
    unread_notifications_count = db.query(schema.Notification
        ).filter(schema.Notification.user_id == current_user.user_id,
                 schema.Notification.is_read == False
        ).all()
    
    return {"unread_notifications_count":unread_notifications_count}

@app.get('/notifications/details', response_model=List[notification.NotificationResponse])
async def get_notifications_details(db:db_dependency, current_user: schema.User = Depends(get_current_user)):
    db_notifications = db.query(schema.Notification
        ).filter(schema.Notification.user_id == current_user.user_id
        ).order_by(schema.Notification.created_at.desc()).all()
    
    return db_notifications


@app.delete('/notification/{notification_id}', response_model=Dict)
async def delete_notification(db: db_dependency, notification_id:int, current_user:schema.User = Depends(get_current_user)):
    
    db_notification = db.query(schema.Notification).filter(schema.Notification.notification_id == notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="notification not found")
    
    if db_notification.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="User not authorized to delete notifications")
    
    db.delete(db_notification)
    db.commit()
    return {"status":"deleted", "message":f"Notification with {notification_id} deleted successfully"}