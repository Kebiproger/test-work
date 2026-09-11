from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models import ProductType

class ProductBase(BaseModel):
    name: str = Field(..., description="Название товара (например, 'Роза красная')")
    description: str | None = Field(None, description="Подробное описание товара (опционально)")
    price: Decimal = Field(..., description="Цена товара")
    stock_quantity: int = Field(..., description="Количество товара в наличии на складе")
    product_type: ProductType = Field(..., description="Тип товара: FLOWER (цветок), BOUQUET (букет), ACCESSORY (аксессуар)")
    is_active: bool = Field(True, description="Активен ли товар (если false, не должен показываться на витрине)")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = Field(None, description="Новое название товара")
    description: str | None = Field(None, description="Новое описание")
    price: Decimal | None = Field(None, description="Новая цена")
    stock_quantity: int | None = Field(None, description="Новое количество на складе")
    product_type: ProductType | None = Field(None, description="Новый тип товара")
    is_active: bool | None = Field(None, description="Изменить статус активности (скрыть/показать)")

class StockUpdate(BaseModel):
    stock_quantity: int = Field(..., description="Точное количество товара, которое сейчас есть на складе")

class ProductPublic(ProductBase):
    id: int = Field(..., description="Уникальный идентификатор товара в базе данных")
    image_url: str | None = Field(None, description="Готовая ссылка на изображение товара (использовать напрямую в src тега <img>, например: /media/uuid_name.jpg)")

    model_config = ConfigDict(from_attributes=True)
