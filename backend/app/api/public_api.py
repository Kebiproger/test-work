from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import services, schemas

public_router=APIRouter(prefix="/api/v1/public",tags=["public"])

@public_router.get("/products",response_model=list[schemas.ProductPublic])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    products = await services.get_products(db, skip=skip, limit=limit)
    return products

@public_router.get("/products/{product_id}", response_model=schemas.ProductPublic)
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    product = await services.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

