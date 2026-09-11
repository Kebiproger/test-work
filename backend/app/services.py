import uuid

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, repositories, schemas
from .config import settings

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
_FILE_CHUNK_SIZE = 1024 * 1024  # 1MB


async def get_product(db: AsyncSession, product_id: int):
    return await repositories.get_product_db(db, product_id)


async def get_products(db: AsyncSession, skip: int, limit: int):
    return await repositories.get_products_db(db, skip, limit)


async def _save_product_image(file: UploadFile) -> str:
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, WEBP are allowed.",
        )

    safe_filename = "".join(
        c for c in file.filename if c.isalnum() or c in (".", "_")
    ).rstrip()
    if not safe_filename:
        safe_filename = "upload"

    unique_filename = f"{uuid.uuid4()}_{safe_filename}"

    save_path = f"{settings.MEDIA_PATH}/{unique_filename}"
    db_image_url = f"{settings.MEDIA_URL_PREFIX}/{unique_filename}"

    try:
        async with aiofiles.open(save_path, "wb") as buffer:
            while content := await file.read(_FILE_CHUNK_SIZE):
                await buffer.write(content)
    except Exception as exc:  # pragma: no cover - runtime safeguard
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {exc}",
        ) from exc
    finally:
        await file.close()

    return db_image_url


async def create_product(
    db: AsyncSession,
    product_in: schemas.ProductCreate,
    file: UploadFile,
):
    image_url = await _save_product_image(file)
    return await repositories.create_product_db(
        db=db,
        product=product_in,
        image_url=image_url,
    )


async def update_product(
    db: AsyncSession,
    db_product: models.Product,
    product_in: schemas.ProductUpdate,
):
    return await repositories.update_product_db(db, db_product, product_in)


async def delete_product(db: AsyncSession, db_product: models.Product):
    return await repositories.delete_product_db(db, db_product)


async def update_stock(
    db: AsyncSession,
    db_product: models.Product,
    stock_in: schemas.StockUpdate,
):
    return await repositories.update_stock_db(db, db_product, stock_in)


async def get_public_product(db: AsyncSession, product_id: int):
    return await repositories.get_public_product_db(db, product_id)


async def get_public_products(db: AsyncSession, skip: int, limit: int):
    return await repositories.get_public_products_db(db, skip, limit)
