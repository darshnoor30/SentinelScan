# Security Policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub private
vulnerability reporting when available, or contact the maintainer through the
address on the GitHub profile. Include reproduction steps, impact, and affected
versions. An acknowledgement should arrive within five business days.

## Deployment guidance

- Replace the development API key and restrict `FRONTEND_URLS` before production.
- Do not treat the Vite-exposed API key as user authentication.
- Store provider credentials in the deployment secret manager, never in source.
- Load only trusted joblib/pickle model artifacts; deserialization can execute code.
- Terminate TLS at a trusted reverse proxy and apply request/rate limits.
- Use PostgreSQL and a migration process for multi-instance deployments.

## Safe research

The repository is for defensive analysis. Do not open suspected phishing URLs in
a normal browser. Live DNS, WHOIS, TLS, and reputation tests are marked as
integration tests so routine CI remains deterministic and does not probe third
parties.
