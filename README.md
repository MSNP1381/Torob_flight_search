# Torob Backend (Architecture v2 Scaffold)

Initial backend scaffold generated from `docs/ARCHITECTURE_NEW_v2.md`.

## Run

```bash
uv run uvicorn src.main:app --reload
```

## Environment

Copy `.env.example` to `.env` and adjust values.

## Local Bootstrap

See `docs/LOCAL_ENV_BOOTSTRAP.md` for the full day-one setup flow:

1. `uv sync --extra dev`
2. `uv run python scripts/db_bootstrap.py`
3. `uv run python scripts/db_seed_reference_data.py`
4. `uv run python scripts/quality_gate.py`
