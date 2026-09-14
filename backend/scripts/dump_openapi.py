"""Dump the FastAPI OpenAPI schema to JSON without starting a server or DB.

Used to (re)generate frontend TypeScript types from the backend contract:

    MEDIA_PATH=/tmp/media DATABASE_URL=postgresql+asyncpg://x:x@localhost/x \\
        ADMIN_API_KEY=dummy python scripts/dump_openapi.py openapi.json

The dummy DATABASE_URL/ADMIN_API_KEY are only needed because `Settings()` is
instantiated at import time; nothing here actually connects to the database.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app  # noqa: E402


def main() -> None:
    out_path = Path(sys.argv[1] if len(sys.argv) > 1 else "openapi.json")
    out_path.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False))
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
