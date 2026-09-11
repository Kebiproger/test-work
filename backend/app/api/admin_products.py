from decimal import Decimal

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas, services
from app.deps import get_api_key
from app.db import get_db

admin_router = APIRouter(prefix="/api/v1/admin", tags=["Admin (Управление)"], dependencies=[Depends(get_api_key)])

@admin_router.post(
    "/products",
    response_model=schemas.ProductPublic,
    status_code=status.HTTP_201_CREATED,
    summary="➕ Создать новый товар с картинкой",
)
async def create_product_with_upload(
    name: str = Form(...),
    description: str | None = Form(None),
    price: Decimal = Form(...),
    stock_quantity: int = Form(...),
    product_type: schemas.ProductType = Form(...),
    is_active: bool = Form(True),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    **Для чего эта ручка?**
    Используется в админ-панели для добавления нового цветка или букета.

    **ВАЖНО для Фронтендера:**
    Данные нужно отправлять не как обычный JSON, а через `FormData` (Content-Type: `multipart/form-data`), потому что мы грузим картинку (`file`).

    **Пример отправки из JS:**
    ```javascript
    const formData = new FormData();
    formData.append('name', 'Роза');
    formData.append('price', '1500');
    formData.append('stock_quantity', '10');
    formData.append('product_type', 'FLOWER');
    formData.append('file', fileInputElement.files[0]);

    fetch('/api/v1/admin/products', {
      method: 'POST',
      headers: { 'X-API-Key': 'твой_ключ' }, // НЕ ставьте Content-Type руками, браузер сам поставит нужный boundary!
      body: formData
    })
    ```
    """
    product_in = schemas.ProductCreate(
        name=name,
        description=description,
        price=price,
        stock_quantity=stock_quantity,
        product_type=product_type,
        is_active=is_active,
    )

    try:
        new_product = await services.create_product(
            db=db,
            product_in=product_in,
            file=file,
        )
        return new_product
    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - runtime safeguard
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {exc}",
        ) from exc


@admin_router.put(
    "/products/{product_id}",
    response_model=schemas.ProductPublic,
    summary="📝 Обновить товар целиком",
)
async def update_product(
    product_id: int,
    product_in: schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    **Для чего эта ручка?**
    Позволяет изменить название, цену, описание или статус активности (скрыть с витрины).

    **Особенности:**
    Здесь картинка не обновляется, отправляется обычный JSON `Content-Type: application/json`.
    Не забудьте передать заголовок `X-API-Key`.
    """
    product = await services.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    updated_product = await services.update_product(db, product, product_in)
    return updated_product


@admin_router.delete(
    "/products/{product_id}",
    response_model=schemas.ProductPublic,
    summary="🗑️ Удалить товар",
)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    **Для чего эта ручка?**
    Удаляет товар из базы безвозвратно. 
    В реальности чаще используют обновление поля `is_active=false` (через PUT), но если нужно удалить — это сюда.
    """
    product = await services.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    deleted_product = await services.delete_product(db, product)
    return deleted_product


@admin_router.patch(
    "/products/{product_id}/stock",
    response_model=schemas.ProductPublic,
    summary="📦 Быстрое изменение остатков",
)
async def update_product_stock(
    product_id: int,
    stock_in: schemas.StockUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    **Для чего эта ручка?**
    Когда нужно просто изменить количество товара на складе (без изменения названия или цены). 
    Принимает JSON с одним полем: `stock_quantity`.
    """
    product = await services.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    updated_product = await services.update_stock(db, product, stock_in)
    return updated_product
