import asyncio
from database import db
from auth import get_password_hash

async def create_super_user():
    email = "superadmin"
    hashed_password = get_password_hash('test')
    result = await db["users"].update_one(
        {"email": email}, 
        {"$set": {"password": hashed_password, "role": "super_admin"}}, 
        upsert=True
    )
    print(f"Super admin user created/updated successfully! Email: {email}")

if __name__ == "__main__":
    asyncio.run(create_super_user())
