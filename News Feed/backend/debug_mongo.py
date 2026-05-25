import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def f():
    client=AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db=client['news_feed']
    post=await db['posts'].find_one({'language': 'English'})
    print(f'Found: {post}')
    
    all_posts = await db['posts'].find({}).to_list(length=10)
    for p in all_posts:
        print(f"Post: {p.get('language')} | {p.get('status')}")

if __name__ == "__main__":
    asyncio.run(f())
