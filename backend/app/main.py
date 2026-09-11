from fastapi import FastAPI

from app.api import admin_products
from app.api import public_api

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

@app.get("/")
def read_root():
    return {"Hello": "World"}
