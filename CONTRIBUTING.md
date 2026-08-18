# Contributing

## Development setup

1. Create a Python 3.11 virtual environment.
2. Install `requirements-dev.txt`.
3. Install frontend packages with `npm ci` inside `frontend/`.
4. Copy `.env.example` to `.env` and `frontend/.env.example` to `frontend/.env`.

Before opening a pull request, run:

```bash
ruff check src database tests
python -m compileall -q src database
pytest -m "not integration"
cd frontend
npm run lint
npm run build
```

Use reserved example domains and documentation IP ranges in tests. Mark any test
that makes DNS, WHOIS, TLS, or provider calls with `@pytest.mark.integration`.
Never commit credentials, raw provider exports, database files, or newly trained
pickle artifacts.
