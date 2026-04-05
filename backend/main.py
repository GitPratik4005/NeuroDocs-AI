from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine, Base
import models.user  # noqa: F401 — register User model for table creation
import models.document  # noqa: F401
import models.chunk  # noqa: F401
from api.auth import router as auth_router
from api.upload import router as upload_router

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(upload_router)


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
