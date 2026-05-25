import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client["news_feed"]
    posts_count = await db["posts"].count_documents({})
    users_count = await db["users"].count_documents({})
    print(f"Posts count: {posts_count}")
    print(f"Users count: {users_count}")
    
    if posts_count > 0:
        post = await db["posts"].find_one({})
        print(f"Sample post: {post}")

if __name__ == "__main__":
    asyncio.run(check_db())
