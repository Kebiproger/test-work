from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models, schemas


async def get_product_db(db: AsyncSession, product_id: int) -> models.Product | None:
    result = await db.execute(
        select(models.Product).where(models.Product.id == product_id)
    )
    return result.scalar_one_or_none()


async def get_products_db(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
) -> list[models.Product]:
    result = await db.execute(
        select(models.Product).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def create_product_db(
    db: AsyncSession,
    product: schemas.ProductCreate,
    image_url: str | None = None,
) -> models.Product:
    db_product = models.Product(**product.model_dump(), image_url=image_url)
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product


async def update_product_db(
    db: AsyncSession,
    db_product: models.Product,
    product_in: schemas.ProductUpdate,
) -> models.Product:
    update_data = product_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_product, field, value)

    await db.commit()
    await db.refresh(db_product)
    return db_product


async def delete_product_db(
    db: AsyncSession,
    db_product: models.Product,
) -> models.Product:
    await db.delete(db_product)
    await db.commit()
    return db_product


async def update_stock_db(
    db: AsyncSession,
    db_product: models.Product,
    stock_in: schemas.StockUpdate,
) -> models.Product:
    db_product.stock_quantity = stock_in.stock_quantity
    await db.commit()
    await db.refresh(db_product)
    return db_product


async def get_public_product_db(
    db: AsyncSession,
    product_id: int,
) -> models.Product | None:
    result = await db.execute(
        select(models.Product).where(
            models.Product.id == product_id,
            models.Product.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def get_public_products_db(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
) -> list[models.Product]:
    result = await db.execute(
        select(models.Product)
        .where(models.Product.is_active.is_(True))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())
