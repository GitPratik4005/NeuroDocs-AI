from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine, Base
import models.user  # noqa: F401 — register User model for table creation
import models.document  # noqa: F401
import models.chunk  # noqa: F401
import models.query  # noqa: F401
import models.conversation  # noqa: F401 — register Conversation models
from api.auth import router as auth_router
from api.upload import router as upload_router
from api.query import router as query_router
from api.conversations import router as conversations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(conversations_router)


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
