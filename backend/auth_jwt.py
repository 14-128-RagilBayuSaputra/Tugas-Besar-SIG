import jwt
import os
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Depends, status
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")

security_bearer = HTTPBearer()

def create_access_token(user_id: int, email: str):
    expire = datetime.now(timezone.utc) + timedelta(hours=12)
    payload = {
        "sub" : str(user_id),
        "email" : email,
        "exp" : expire
    }
    
    encoded_jwt = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "user_id": int(payload.get("sub")),
            "email": payload.get("email")
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    
def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security_bearer)):
    token = credentials.credentials
    admin_data = verify_access_token(token)
    
    if admin_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak sah atau sudah kedaluwarsa! Silakan login kembali.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return admin_data