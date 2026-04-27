from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
import os
import shutil
from bson import ObjectId

from models import PostCreate, PostUpdate, PostOut
from database import get_db
from auth import get_current_user, TokenData

router = APIRouter(prefix="/posts", tags=["posts"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[PostOut])
async def get_posts(
    language: Optional[str] = None,
    secondary_language: Optional[str] = None,
    location: Optional[str] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    db = get_db()
    query = {}
    
    if language and secondary_language and secondary_language.lower() != "none":
        query["$or"] = [{"language": language}, {"language": secondary_language}]
    elif language:
        query["language"] = language
        
    if location and location != "Global":
        query["location"] = location
        
    if category and category != "All":
        query["category"] = category

    skip = (page - 1) * limit
    cursor = db["posts"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts

@router.get("/admin-posts", response_model=List[PostOut])
async def get_admin_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: TokenData = Depends(get_current_user)
):
    db = get_db()
    query = {}
    if current_user.role != "super_admin":
        query["author"] = current_user.username

    skip = (page - 1) * limit
    cursor = db["posts"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)
    
    for post in posts:
        post["_id"] = str(post["_id"])
    return posts

@router.get("/{id}", response_model=PostOut)
async def get_post(id: str):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    post = await db["posts"].find_one({"_id": ObjectId(id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post["_id"] = str(post["_id"])
    return post

@router.post("/", response_model=PostOut)
async def create_post(
    title: str = Form(...),
    description: str = Form(...),
    content: str = Form(...),
    language: str = Form(...),
    location: str = Form(...),
    meta_title: Optional[str] = Form(None),
    meta_description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_user)
):
    db = get_db()
    
    image_url = None
    if image:
        file_path = os.path.join(UPLOAD_DIR, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/uploads/{image.filename}"

    new_post = {
        "title": title,
        "description": description,
        "content": content,
        "image_url": image_url,
        "meta_title": meta_title,
        "meta_description": meta_description,
        "language": language,
        "location": location,
        "category": category,
        "author": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    result = await db["posts"].insert_one(new_post)
    created_post = await db["posts"].find_one({"_id": result.inserted_id})
    created_post["_id"] = str(created_post["_id"])
    return created_post

@router.put("/{id}", response_model=PostOut)
async def update_post(
    id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    meta_title: Optional[str] = Form(None),
    meta_description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: TokenData = Depends(get_current_user)
):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    existing_post = await db["posts"].find_one({"_id": ObjectId(id)})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if current_user.role != "super_admin" and existing_post.get("author") != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to edit this post")
        
    update_data = {}
    if title is not None: update_data["title"] = title
    if description is not None: update_data["description"] = description
    if content is not None: update_data["content"] = content
    if language is not None: update_data["language"] = language
    if location is not None: update_data["location"] = location
    if meta_title is not None: update_data["meta_title"] = meta_title
    if meta_description is not None: update_data["meta_description"] = meta_description
    if category is not None: update_data["category"] = category
    
    if image:
        file_path = os.path.join(UPLOAD_DIR, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        update_data["image_url"] = f"/uploads/{image.filename}"

    if update_data:
        await db["posts"].update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        
    updated_post = await db["posts"].find_one({"_id": ObjectId(id)})
    if not updated_post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    updated_post["_id"] = str(updated_post["_id"])
    return updated_post

@router.delete("/{id}")
async def delete_post(id: str, current_user: TokenData = Depends(get_current_user)):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    existing_post = await db["posts"].find_one({"_id": ObjectId(id)})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if current_user.role != "super_admin" and existing_post.get("author") != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
    result = await db["posts"].delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
        
    return {"message": "Post deleted successfully"}
