from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Optional
import os
import shutil
from bson import ObjectId
from auth import create_access_token, get_password_hash, verify_password, get_current_super_admin, get_current_user
from config import settings
from database import get_db
from models import Token, AdminCreate, TokenData, UserProfileOut

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

@router.delete("/users/{user_id}", dependencies=[Depends(get_current_super_admin)])
async def delete_user(user_id: str, current_user: TokenData = Depends(get_current_super_admin)):
    db = get_db()
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID format")
        
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("role") == "super_admin":
        raise HTTPException(status_code=403, detail="Cannot delete super admin")
        
    result = await db["users"].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Admin user deleted successfully"}

@router.get("/profile", response_model=UserProfileOut)
async def get_profile(current_user: TokenData = Depends(get_current_user)):
    db = get_db()
    filters = []
    if current_user.email:
        filters.append({"email": current_user.email})
    if current_user.username:
        filters.append({"username": current_user.username})
        
    if not filters:
        raise HTTPException(status_code=400, detail="Invalid token data")
        
    user = await db["users"].find_one({"$or": filters})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return UserProfileOut(
        id=str(user["_id"]),
        username=user.get("username"),
        email=user.get("email"),
        role=user.get("role"),
        owner_name=user.get("owner_name"),
        channel_name=user.get("channel_name"),
        profile_pic=user.get("profile_pic")
    )

@router.put("/profile", response_model=UserProfileOut)
async def update_profile(
    owner_name: Optional[str] = Form(None),
    channel_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    profile_pic: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_user)
):
    db = get_db()
    filters = []
    if current_user.email:
        filters.append({"email": current_user.email})
    if current_user.username:
        filters.append({"username": current_user.username})
        
    if not filters:
        raise HTTPException(status_code=400, detail="Invalid token data")
        
    user = await db["users"].find_one({"$or": filters})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = {}
    if owner_name is not None:
        update_data["owner_name"] = owner_name
    if channel_name is not None:
        update_data["channel_name"] = channel_name
        
    if email is not None:
        if email != user.get("email"):
            existing = await db["users"].find_one({"email": email})
            if existing:
                raise HTTPException(status_code=400, detail="Email is already in use by another user")
            update_data["email"] = email

    if profile_pic:
        UPLOAD_DIR = "uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(UPLOAD_DIR, profile_pic.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_pic.file, buffer)
        update_data["profile_pic"] = f"/uploads/{profile_pic.filename}"
        
    if update_data:
        await db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": update_data}
        )
        user = await db["users"].find_one({"_id": user["_id"]})
        
    return UserProfileOut(
        id=str(user["_id"]),
        username=user.get("username"),
        email=user.get("email"),
        role=user.get("role"),
        owner_name=user.get("owner_name"),
        channel_name=user.get("channel_name"),
        profile_pic=user.get("profile_pic")
    )
