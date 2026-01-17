#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Photo Gallery - Dev Environment     ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=0

    echo -e "${YELLOW}Aguardando $name na porta $port...${NC}"
    while ! check_port $port && [ $attempt -lt $max_attempts ]; do
        sleep 1
        attempt=$((attempt + 1))
    done

    if check_port $port; then
        echo -e "${GREEN}$name esta rodando na porta $port${NC}"
        return 0
    else
        echo -e "${RED}$name nao iniciou na porta $port${NC}"
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Encerrando processo na porta $port (PID: $pid)${NC}"
        kill $pid 2>/dev/null
        sleep 1
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Encerrando servicos...${NC}"
    kill_port 3000  # Frontend
    kill_port 4000  # API Gateway
    kill_port 4001  # Auth Service
    kill_port 4002  # Albums Service
    kill_port 4003  # Photos Service
    kill_port 4004  # Upload Service
    echo -e "${GREEN}Servicos encerrados. Docker continua rodando.${NC}"
    exit 0
}

# Trap CTRL+C
trap cleanup SIGINT SIGTERM

# Step 1: Start Docker containers (only postgres and minio for dev)
echo -e "\n${BLUE}[1/6] Iniciando containers Docker (PostgreSQL e MinIO)...${NC}"
cd "$PROJECT_DIR"

# Check if docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}Docker nao esta rodando. Por favor, inicie o Docker primeiro.${NC}"
    exit 1
fi

# Start only postgres and minio
docker compose up -d postgres minio

# Wait for postgres to be healthy
echo -e "${YELLOW}Aguardando PostgreSQL ficar pronto...${NC}"
until docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}PostgreSQL esta pronto!${NC}"

# Wait for MinIO to be healthy
echo -e "${YELLOW}Aguardando MinIO ficar pronto...${NC}"
until curl -s http://localhost:9000/minio/health/live >/dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}MinIO esta pronto!${NC}"

# Create MinIO bucket if it doesn't exist
echo -e "${YELLOW}Criando bucket 'photos' no MinIO...${NC}"
docker exec minio-photo-gallery mc alias set local http://localhost:9000 minioadmin minioadmin >/dev/null 2>&1
if docker exec minio-photo-gallery mc ls local/photos >/dev/null 2>&1; then
    echo -e "${GREEN}Bucket 'photos' ja existe${NC}"
else
    docker exec minio-photo-gallery mc mb local/photos >/dev/null 2>&1
    echo -e "${GREEN}Bucket 'photos' criado com sucesso!${NC}"
fi

# Step 2: Install dependencies for all services
echo -e "\n${BLUE}[2/6] Instalando dependencias dos servicos...${NC}"

SERVICES=("api-gateway" "auth-service" "albums-service" "photos-service" "upload-service")

for service in "${SERVICES[@]}"; do
    echo -e "${YELLOW}Instalando dependencias: $service${NC}"
    cd "$PROJECT_DIR/services/$service"
    npm install --silent
done

# Install frontend dependencies
echo -e "${YELLOW}Instalando dependencias: frontend${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent

echo -e "${GREEN}Dependencias instaladas!${NC}"

# Step 3: Run database migrations
echo -e "\n${BLUE}[3/6] Executando migrations do banco de dados...${NC}"

# Build and run auth-service migrations
echo -e "${YELLOW}Executando migrations: auth-service${NC}"
cd "$PROJECT_DIR/services/auth-service"
npm run build --silent 2>/dev/null
npm run migration:run --silent 2>/dev/null
echo -e "${GREEN}Migrations auth-service executadas!${NC}"

# Build and run albums-service migrations
echo -e "${YELLOW}Executando migrations: albums-service${NC}"
cd "$PROJECT_DIR/services/albums-service"
npm run build --silent 2>/dev/null
npm run migration:run --silent 2>/dev/null
echo -e "${GREEN}Migrations albums-service executadas!${NC}"

# Step 4: Start all backend services
echo -e "\n${BLUE}[4/6] Iniciando servicos backend...${NC}"

# Kill any existing processes on the ports
kill_port 4000
kill_port 4001
kill_port 4002
kill_port 4003
kill_port 4004

# Create logs directory
mkdir -p /tmp/photo-gallery-logs

# Start Auth Service (must start first as others may depend on it)
echo -e "${YELLOW}Iniciando auth-service...${NC}"
cd "$PROJECT_DIR/services/auth-service"
npm run start:dev > /tmp/photo-gallery-logs/auth-service.log 2>&1 &
wait_for_service 4001 "auth-service"

# Start Albums Service
echo -e "${YELLOW}Iniciando albums-service...${NC}"
cd "$PROJECT_DIR/services/albums-service"
npm run start:dev > /tmp/photo-gallery-logs/albums-service.log 2>&1 &
wait_for_service 4002 "albums-service"

# Start Photos Service
echo -e "${YELLOW}Iniciando photos-service...${NC}"
cd "$PROJECT_DIR/services/photos-service"
npm run start:dev > /tmp/photo-gallery-logs/photos-service.log 2>&1 &
wait_for_service 4003 "photos-service"

# Start Upload Service
echo -e "${YELLOW}Iniciando upload-service...${NC}"
cd "$PROJECT_DIR/services/upload-service"
npm run start:dev > /tmp/photo-gallery-logs/upload-service.log 2>&1 &
wait_for_service 4004 "upload-service"

# Start API Gateway (must start after other services)
echo -e "${YELLOW}Iniciando api-gateway...${NC}"
cd "$PROJECT_DIR/services/api-gateway"
npm run start:dev > /tmp/photo-gallery-logs/api-gateway.log 2>&1 &
wait_for_service 4000 "api-gateway"

echo -e "${GREEN}Todos os servicos backend estao rodando!${NC}"

# Step 5: Start Frontend
echo -e "\n${BLUE}[5/6] Iniciando frontend...${NC}"
kill_port 3000
cd "$PROJECT_DIR/frontend"
npm run dev > /tmp/photo-gallery-logs/frontend.log 2>&1 &
wait_for_service 3000 "frontend"

# Step 6: Summary
echo -e "\n${BLUE}[6/6] Finalizando...${NC}"
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Ambiente de desenvolvimento pronto!  ${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e ""
echo -e "${BLUE}Servicos rodando:${NC}"
echo -e "  - Frontend:       ${GREEN}http://localhost:3000${NC}"
echo -e "  - API Gateway:    ${GREEN}http://localhost:4000${NC}"
echo -e "  - Auth Service:   ${GREEN}http://localhost:4001${NC}"
echo -e "  - Albums Service: ${GREEN}http://localhost:4002${NC}"
echo -e "  - Photos Service: ${GREEN}http://localhost:4003${NC}"
echo -e "  - Upload Service: ${GREEN}http://localhost:4004${NC}"
echo -e "  - PostgreSQL:     ${GREEN}http://localhost:5432${NC}"
echo -e "  - MinIO Console:  ${GREEN}http://localhost:9001${NC}"
echo -e ""
echo -e "${BLUE}Logs disponiveis em:${NC} /tmp/photo-gallery-logs/"
echo -e ""
echo -e "${YELLOW}Pressione Ctrl+C para encerrar todos os servicos${NC}"
echo -e ""

# Keep script running and wait for CTRL+C
while true; do
    sleep 1
done
