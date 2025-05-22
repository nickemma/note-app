from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from jose import jwt, JWTError
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
mongo_uri = os.getenv("MONGO_URI")
jwt_secret = os.getenv("JWT_SECRET")
client = MongoClient(mongo_uri)
db = client["notesdb"]

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/stats")
async def get_stats(payload: dict = Depends(verify_token)):
    user_id = payload.get("userId")
    note_count = db.notes.count_documents({"userId": user_id})
    total_notes = db.notes.count_documents({})
    return {"user_note_count": note_count, "total_notes": total_notes}