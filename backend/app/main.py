from fastapi import FastAPI

from app.api import admin_products
from app.api import public_api

app = FastAPI(title="Flower Shop API")

app.include_router(admin_products.admin_router)
app.include_router(public_api.public_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}
