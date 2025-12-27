# Production Docker Setup

This directory contains SSL certificates and configuration files for production Docker services.

## PostgreSQL SSL Certificates

To enable SSL for PostgreSQL, generate certificates:

```bash
# Create directory
mkdir -p docker/postgres/ssl

# Generate CA private key
openssl genrsa -out docker/postgres/ssl/ca.key 4096

# Generate CA certificate
openssl req -new -x509 -days 3650 -key docker/postgres/ssl/ca.key \
  -out docker/postgres/ssl/ca.crt \
  -subj "/CN=DocDB CA/O=DocDB/C=FR"

# Generate server private key
openssl genrsa -out docker/postgres/ssl/server.key 4096

# Generate server certificate signing request
openssl req -new -key docker/postgres/ssl/server.key \
  -out docker/postgres/ssl/server.csr \
  -subj "/CN=localhost/O=DocDB/C=FR"

# Sign server certificate with CA
openssl x509 -req -in docker/postgres/ssl/server.csr \
  -CA docker/postgres/ssl/ca.crt -CAkey docker/postgres/ssl/ca.key \
  -CAcreateserial -out docker/postgres/ssl/server.crt \
  -days 3650

# Set correct permissions
chmod 600 docker/postgres/ssl/server.key
chmod 644 docker/postgres/ssl/server.crt docker/postgres/ssl/ca.crt

# Clean up
rm docker/postgres/ssl/server.csr docker/postgres/ssl/ca.key docker/postgres/ssl/ca.srl
```

## MinIO SSL Certificates

For MinIO SSL (optional for local prod testing):

```bash
# Create directory
mkdir -p docker/minio/certs

# Generate private key
openssl genrsa -out docker/minio/certs/private.key 4096

# Generate certificate
openssl req -new -x509 -days 3650 \
  -key docker/minio/certs/private.key \
  -out docker/minio/certs/public.crt \
  -subj "/CN=localhost/O=DocDB/C=FR"

# Set permissions
chmod 600 docker/minio/certs/private.key
chmod 644 docker/minio/certs/public.crt
```

## Environment Variables

Create `.env.prod` with:

```env
# Database
DATABASE_USER=docdb
DATABASE_PASSWORD=<strong-password>
DATABASE_NAME=docdb
DATABASE_PORT=5432

# MinIO
MINIO_ROOT_USER=docdb
MINIO_ROOT_PASSWORD=<strong-password>
MINIO_KMS_SECRET_KEY=<32-char-key>
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Redis
REDIS_PASSWORD=<strong-password>
REDIS_PORT=6379
```

## Usage

```bash
# Start production services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: data loss)
docker-compose -f docker-compose.prod.yml down -v
```

## Security Notes

- All passwords MUST be strong (minimum 32 characters)
- Never commit `.env.prod` or certificate private keys to version control
- Rotate passwords regularly (every 90 days)
- Keep certificates in a secure location
- Use separate credentials for each environment
