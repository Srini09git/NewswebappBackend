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

async def populate_channel_name(post: dict, db) -> dict:
    if not post:
        return post
    author = post.get("author")
    if author:
        user = await db["users"].find_one({"$or": [{"username": author}, {"email": author}]})
        if user:
            post["channel_name"] = user.get("channel_name")
            post["channel_email"] = user.get("email")
    return post

async def populate_channel_names(posts: list, db) -> list:
    authors = list(set(p.get("author") for p in posts if p.get("author")))
    if not authors:
        return posts
    
    users = await db["users"].find({"$or": [{"username": {"$in": authors}}, {"email": {"$in": authors}}]}).to_list(length=len(authors))
    
    author_map = {}
    email_map = {}
    for u in users:
        c_name = u.get("channel_name")
        c_email = u.get("email")
        if c_name:
            if u.get("username"):
                author_map[u["username"]] = c_name
            if u.get("email"):
                author_map[u["email"]] = c_name
        if c_email:
            if u.get("username"):
                email_map[u["username"]] = c_email
            if u.get("email"):
                email_map[u["email"]] = c_email
                
    for post in posts:
        author = post.get("author")
        if author:
            if author in author_map:
                post["channel_name"] = author_map[author]
            if author in email_map:
                post["channel_email"] = email_map[author]
            
    return posts

@router.get("/", response_model=List[PostOut])
async def get_posts(
    language: Optional[str] = None,
    secondary_language: Optional[str] = None,
    location: Optional[str] = None,
    category: Optional[str] = None,
    search_query: Optional[str] = None,
    post_ids: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    try:
        db = get_db()
        # Include posts that are either explicitly "Visible" OR have no status field set
        query = {"$or": [{"status": "Visible"}, {"status": {"$exists": False}}, {"status": None}]}
        
        if language:
            if secondary_language:
                query["language"] = {"$in": [language, secondary_language]}
            else:
                query["language"] = language
                
        if location and location != "Global":
            query["location"] = location
            
        if category:
            query["category"] = category

        if search_query:
            query["$or"] = [
                {"title": {"$regex": search_query, "$options": "i"}},
                {"content": {"$regex": search_query, "$options": "i"}},
                {"description": {"$regex": search_query, "$options": "i"}},
                {"tags": {"$regex": search_query, "$options": "i"}}
            ]
            
        if post_ids:
            ids_list = [ObjectId(pid) for pid in post_ids.split(",") if ObjectId.is_valid(pid)]
            if ids_list:
                query["_id"] = {"$in": ids_list}

        skip = (page - 1) * limit
        cursor = db["posts"].find(query).sort("created_at", -1).skip(skip).limit(limit)
        posts = await cursor.to_list(length=limit)
        
        if posts:
            for post in posts:
                post["_id"] = str(post["_id"])
            posts = await populate_channel_names(posts, db)
            return posts
    except Exception as e:
        print(f"Database error in get_posts: {e}")
        pass

    # Mock data fallback
    mock_posts = [
        {
            "_id": "mock1",
            "title": "Global Tech Summit 2026",
            "description": "Leading innovators gather to discuss the future of AI and sustainable technology.",
            "content": "<h3>Welcome to the Future</h3><p>The tech summit covered several key areas:</p><ul><li>Artificial Intelligence and Ethics</li><li>Sustainable Energy Solutions</li><li>Quantum Computing Breakthroughs</li></ul><p>Stay tuned for more updates!</p>",
            "image_url": "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop",
            "language": "English",
            "location": "Global",
            "category": "Technology",
            "author": "admin",
            "created_at": datetime.utcnow(),
            "status": "Visible"
        },
        # ... (rest of mock data can stay or be trimmed)
    ]
    return mock_posts[:limit]

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
    posts = await populate_channel_names(posts, db)
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
    post = await populate_channel_name(post, db)
    return post

@router.post("/", response_model=PostOut)
async def create_post(
    title: str = Form(...),
    description: str = Form(...),
    content: str = Form(...),
    language: str = Form(...),
    location: str = Form(...),
    excerpt: Optional[str] = Form(None),
    status: str = Form("Visible"),
    tags: Optional[str] = Form(None),
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
        "image_url": image_url or "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80",
        "meta_title": meta_title,
        "meta_description": meta_description,
        "language": language,
        "location": location,
        "category": category,
        "excerpt": excerpt,
        "status": status,
        "tags": tags,
        "author": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    result = await db["posts"].insert_one(new_post)
    new_post["_id"] = str(result.inserted_id)
    new_post = await populate_channel_name(new_post, db)
    return new_post

@router.put("/{id}", response_model=PostOut)
async def update_post(
    id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    excerpt: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
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
    if excerpt is not None: update_data["excerpt"] = excerpt
    if status is not None: update_data["status"] = status
    if tags is not None: update_data["tags"] = tags
    
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
    updated_post = await populate_channel_name(updated_post, db)
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

from models import CommentCreate, CommentOut

@router.post("/{id}/comments", response_model=CommentOut)
async def add_comment(id: str, comment: CommentCreate):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid post ID format")

    post = await db["posts"].find_one({"_id": ObjectId(id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = {
        "post_id": id,
        "content": comment.content,
        "author": comment.author,
        "parent_id": comment.parent_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db["comments"].insert_one(new_comment)
    new_comment["_id"] = str(result.inserted_id)
    new_comment["replies"] = []
    return new_comment

@router.get("/{id}/comments", response_model=List[CommentOut])
async def get_comments(id: str):
    db = get_db()
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid post ID format")

    cursor = db["comments"].find({"post_id": id}).sort("created_at", 1)
    comments = await cursor.to_list(length=1000)
    
    # Structure comments into a tree
    comment_map = {}
    root_comments = []
    
    for c in comments:
        c["_id"] = str(c["_id"])
        c["replies"] = []
        comment_map[c["_id"]] = c
        
    for c in comments:
        if c.get("parent_id") and c["parent_id"] in comment_map:
            comment_map[c["parent_id"]]["replies"].append(c)
        else:
            root_comments.append(c)
            
    return root_comments
