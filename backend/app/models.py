from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, Enum, Integer, Numeric, String, Text

from app.db import Base


class ProductType(str, PyEnum):
    FLOWER = "FLOWER"
    BOUQUET = "BOUQUET"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    product_type = Column(Enum(ProductType), nullable=False)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
