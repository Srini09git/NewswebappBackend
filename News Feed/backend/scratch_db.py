import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017")
    db = client["news_feed"]
    user = await db["users"].find_one({})
    post = await db["posts"].find_one({})
    print("USER:", user)
    print("POST:", post)

if __name__ == "__main__":
    asyncio.run(check())
