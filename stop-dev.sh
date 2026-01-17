#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Encerrando ambiente de dev          ${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Encerrando $name na porta $port (PID: $pid)${NC}"
        kill $pid 2>/dev/null
        sleep 1
        echo -e "${GREEN}$name encerrado${NC}"
    else
        echo -e "${YELLOW}$name nao estava rodando na porta $port${NC}"
    fi
}

# Stop all services
echo -e "\n${BLUE}Encerrando servicos...${NC}"
kill_port 3000 "Frontend"
kill_port 4000 "API Gateway"
kill_port 4001 "Auth Service"
kill_port 4002 "Albums Service"
kill_port 4003 "Photos Service"
kill_port 4004 "Upload Service"

# Ask about Docker
echo -e ""
read -p "Deseja parar os containers Docker (PostgreSQL e MinIO)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Parando containers Docker...${NC}"
    cd "$PROJECT_DIR"
    docker compose down
    echo -e "${GREEN}Containers Docker parados${NC}"
else
    echo -e "${YELLOW}Containers Docker continuam rodando${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Ambiente encerrado com sucesso!     ${NC}"
echo -e "${GREEN}========================================${NC}"
