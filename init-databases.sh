#!/bin/bash
set -e

echo "Creating databases for microservices..."

# Create auth database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE innogram_auth;
    GRANT ALL PRIVILEGES ON DATABASE innogram_auth TO "$POSTGRES_USER";
EOSQL

# Create posts database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE innogram_posts;
    GRANT ALL PRIVILEGES ON DATABASE innogram_posts TO "$POSTGRES_USER";
EOSQL

echo "Databases created successfully!"
