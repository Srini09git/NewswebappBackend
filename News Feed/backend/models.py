from pydantic import BaseModel, Field
from typing import Optional, Union
from datetime import datetime

class Translation(BaseModel):
    en: str
    ta: Optional[str] = None

class PydanticObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise TypeError('ObjectId required')
        return v

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class AdminUser(BaseModel):
    username: str
    password: str

class AdminCreate(BaseModel):
    email: str
    password: str

class PostCreate(BaseModel):
    title: Union[Translation, str]
    description: Union[Translation, str]
    content: Union[Translation, str]
    image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    language: str
    location: str
    category: Optional[str] = None

class PostUpdate(BaseModel):
    title: Union[Translation, str, None] = None
    description: Union[Translation, str, None] = None
    content: Union[Translation, str, None] = None
    image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    language: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None

class PostOut(BaseModel):
    id: str = Field(alias="_id")
    title: Union[Translation, str]
    description: Union[Translation, str]
    content: Union[Translation, str]
    image_url: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    language: str
    location: str
    category: Optional[str] = None
    author: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
