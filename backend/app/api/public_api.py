from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import services, schemas

public_router = APIRouter(prefix="/api/v1/public", tags=["Public (Витрина)"])

@public_router.get(
    "/products",
    response_model=list[schemas.ProductPublic],
    summary="💐 Витрина: Получить список всех товаров",
)
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """
    **Для чего эта ручка?**
    Используется для главной страницы магазина (витрины). Отдает массив товаров, которые можно отобразить пользователю.

    **Параметры:**
    * `skip` — отступ (сколько товаров пропустить, по умолчанию 0). Используется для пагинации.
    * `limit` — сколько товаров загрузить за раз (по умолчанию 100).

    **Что возвращает:**
    Список объектов. У каждого есть `image_url` (ссылка на фото) и `price` (цена). Если товаров нет, вернется пустой массив `[]`.
    """
    products = await services.get_products(db, skip=skip, limit=limit)
    return products

@public_router.get(
    "/products/{product_id}",
    response_model=schemas.ProductPublic,
    summary="🔍 Детали: Получить карточку одного товара",
)
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    **Для чего эта ручка?**
    Используется при клике на конкретный товар, чтобы открыть его детальную страницу.

    **Как использовать:**
    Передайте `id` товара в URL (например: `/api/v1/public/products/5`).

    **Ошибки:**
    Если товар с таким ID не найден, бэкенд вернет ошибку `404 Not Found`. Фронтенду нужно обработать её (например, показать страницу "Товар не найден").
    """
    product = await services.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
