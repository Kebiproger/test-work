import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api import admin_products
from app.api import public_api
from app.config import settings

tags_metadata = [
    {
        "name": "Public (Витрина)",
        "description": "Публичные методы для витрины магазина (доступны всем пользователям).",
    },
    {
        "name": "Admin (Управление)",
        "description": "Методы для управления товарами. Требуют передачи заголовка **X-API-Key**.",
    },
]

app = FastAPI(
    title="Flower Shop API",
    description="API для интернет-магазина цветов. Содержит публичную часть для покупателей и приватную для администраторов.",
    version="1.0.0",
    openapi_tags=tags_metadata,
)

app.include_router(admin_products.admin_router)
app.include_router(public_api.public_router)

# In production nginx serves /media directly from the shared Docker volume
# (see frontend/nginx.conf), so this mount is redundant there. It matters
# for local/dev runs of the backend alone, where nothing else serves the
# uploaded images.
os.makedirs(settings.MEDIA_PATH, exist_ok=True)
app.mount(
    settings.MEDIA_URL_PREFIX,
    StaticFiles(directory=settings.MEDIA_PATH),
    name="media",
)

@app.get("/")
def read_root():
    return {"Hello": "World"}
