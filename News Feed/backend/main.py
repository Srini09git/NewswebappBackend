from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import auth_routes, post_routes
import os

app = FastAPI(title="News Feed API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, ideally change to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth_routes.router)
app.include_router(post_routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the News Feed API"}
