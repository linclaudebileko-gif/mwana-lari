from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: str = "PARENT" # 'PARENT', 'TEACHER', 'LINGUIST', 'ADMIN'
    country_code: str = "CG"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: str
    country_code: str
    created_at: datetime

    class Config:
        from_attributes = True
