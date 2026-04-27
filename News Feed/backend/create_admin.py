import asyncio
from database import db
from auth import get_password_hash

async def create_user():
    hashed_password = get_password_hash('test')
    result = await db["users"].update_one(
        {"username": "admin"}, 
        {"$set": {"password": hashed_password, "role": "admin"}}, 
        upsert=True
    )
    print("Admin user created/updated successfully!")

asyncio.run(create_user())
