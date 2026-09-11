from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models import ProductType


class ProductBase(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock_quantity: int
    product_type: ProductType
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None
    product_type: ProductType | None = None
    is_active: bool | None = None


class StockUpdate(BaseModel):
    stock_quantity: int


class ProductPublic(ProductBase):
    id: int
    image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)
