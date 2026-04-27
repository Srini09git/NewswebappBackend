from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from auth import create_access_token, get_password_hash, verify_password, get_current_super_admin
from config import settings
from database import get_db
from models import Token, AdminCreate, TokenData

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = await db["users"].find_one({
        "$or": [{"username": form_data.username}, {"email": form_data.username}]
    })
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Use username or email as the sub
    sub_val = user.get("username") or user.get("email")
    access_token = create_access_token(
        data={
            "sub": sub_val, 
            "email": user.get("email"), 
            "role": user.get("role", "admin")
        }, 
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/setup")
async def setup_admin(admin: AdminCreate):
    db = get_db()
    hashed_password = get_password_hash(admin.password)
    # Using email for setup_admin since AdminCreate uses email now
    await db["users"].update_one(
        {"email": admin.email},
        {"$set": {"password": hashed_password, "role": "admin"}},
        upsert=True
    )
    return {"msg": "Admin user created successfully!"}

@router.post("/create-admin", dependencies=[Depends(get_current_super_admin)])
async def create_admin(admin: AdminCreate):
    db = get_db()
    
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": admin.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    hashed_password = get_password_hash(admin.password)
    await db["users"].insert_one({
        "email": admin.email,
        "password": hashed_password,
        "role": "admin"
    })
    return {"msg": "Admin user created successfully!"}

@router.get("/users", dependencies=[Depends(get_current_super_admin)])
async def get_users():
    db = get_db()
    users_cursor = db["users"].find({}, {"password": 0})
    users = await users_cursor.to_list(length=100)
    # Convert ObjectId to string for JSON serialization
    for user in users:
        user["_id"] = str(user["_id"])
    return users
