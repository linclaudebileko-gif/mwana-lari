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

class DemoLoginRequest(BaseModel):
    role: str  # 'parent', 'teacher', 'linguist', 'admin'

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: str
    full_name: str
    csrf_token: Optional[str] = None

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

class SessionStatus(BaseModel):
    authenticated: bool
    user: Optional[UserOut] = None
    csrf_token: Optional[str] = None

