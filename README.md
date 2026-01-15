# Photo Gallery - Meus Álbuns de Fotos

Uma aplicação web completa para gerenciamento de álbuns de fotos, construída com arquitetura de microsserviços.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14, React 18, Shadcn/ui, Tailwind CSS, React Query |
| Backend | NestJS (5 microsserviços), TypeORM, PostgreSQL |
| Storage | MinIO (S3-compatível) |
| Auth | JWT + Google OAuth |
| Email | Resend |
| Infra | Docker Compose |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                      porta 3000                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    API Gateway                               │
│                    porta 4000                                │
│         (roteamento, rate limiting, validação JWT)          │
└──────┬──────────┬──────────┬──────────┬────────────────────┘
       │          │          │          │
┌──────▼───┐ ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐
│  Auth    │ │ Albums  │ │ Photos │ │ Upload  │
│  Service │ │ Service │ │ Service│ │ Service │
│  :4001   │ │  :4002  │ │ :4003  │ │  :4004  │
└──────────┘ └─────────┘ └────────┘ └─────────┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                      │
              ┌───────▼───────┐
              │  PostgreSQL   │
              │    :5432      │
              └───────────────┘
                      │
              ┌───────▼───────┐
              │    MinIO      │
              │    :9000      │
              └───────────────┘
```

## Pré-requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker e Docker Compose

## Instalação

```bash
# Clonar o repositório
git clone <repo-url>
cd dr-tis

# Instalar dependências
pnpm install

# Copiar arquivo de configuração
cp .env.example .env
```

## Executando em Desenvolvimento

### 1. Iniciar infraestrutura (PostgreSQL e MinIO)

```bash
pnpm dev
# ou
docker-compose -f docker-compose.dev.yml up -d
```

Isso iniciará:
- **PostgreSQL** em `localhost:5432`
- **MinIO** em `localhost:9000` (Console: `localhost:9001`)

### 2. Configurar o MinIO

Acesse o console do MinIO em http://localhost:9001:
- Login: `minioadmin`
- Senha: `minioadmin`

Crie um bucket chamado `photos`.

### 3. Rodar migrations do banco de dados

```bash
cd services/auth-service
npm run build
npm run migration:run
```

### 4. Iniciar os microsserviços

Em terminais separados, execute:

```bash
# Auth Service (porta 4001)
cd services/auth-service && npm run start:dev

# Albums Service (porta 4002)
cd services/albums-service && npm run start:dev

# Photos Service (porta 4003)
cd services/photos-service && npm run start:dev

# Upload Service (porta 4004)
cd services/upload-service && npm run start:dev

# API Gateway (porta 4000)
cd services/api-gateway && npm run start:dev
```

### 5. Iniciar o frontend

```bash
cd frontend && npm run dev
```

### 6. Acessar a aplicação

Abra http://localhost:3000 no navegador.

## Executando em Produção (Docker)

```bash
# Build e start de todos os containers
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=photo_gallery
DB_USER=postgres
DB_PASSWORD=postgres

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=photos

# JWT
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret

# Resend (para envio de emails)
RESEND_API_KEY=sua-api-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api
FRONTEND_URL=http://localhost:3000
```

## Endpoints da API

### Auth Service (`/api/auth`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Cadastro de usuário |
| POST | `/auth/login` | Login |
| POST | `/auth/google` | Login com Google |
| POST | `/auth/forgot-password` | Solicitar recuperação de senha |
| POST | `/auth/reset-password` | Redefinir senha |
| POST | `/auth/refresh` | Renovar token |
| GET | `/auth/me` | Dados do usuário logado |

### Albums Service (`/api/albums`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/albums` | Listar álbuns (paginado) |
| POST | `/albums` | Criar álbum |
| GET | `/albums/:id` | Detalhes do álbum |
| PATCH | `/albums/:id` | Editar álbum |
| DELETE | `/albums/:id` | Excluir álbum |
| POST | `/albums/:id/share` | Gerar link de compartilhamento |
| DELETE | `/albums/:id/share` | Revogar compartilhamento |
| GET | `/albums/shared/:token` | Acessar álbum público |

### Photos Service (`/api/photos`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/photos/album/:albumId` | Listar fotos do álbum |
| GET | `/photos/:id` | Detalhes da foto |
| PATCH | `/photos/:id` | Editar foto |
| DELETE | `/photos/:id` | Excluir foto |

### Upload Service (`/api/upload`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/upload/photo/:albumId` | Upload de foto única |
| POST | `/upload/photos/:albumId` | Upload múltiplo |
| GET | `/upload/presigned/:key` | URL assinada para download |

## Features

### Funcionalidades Principais
- Cadastro e login de usuários
- CRUD completo de álbuns
- Upload de fotos com drag-and-drop
- Visualização de fotos em grid e modal
- Compartilhamento público de álbuns

### Features Bônus Implementadas
- [x] Framework de UI (Shadcn/Tailwind)
- [x] Recuperação de senha com email
- [x] Validação de todos os campos
- [x] Google OAuth (arquitetura pronta)
- [x] Detecção automática de cor dominante
- [x] Extração automática de data EXIF
- [x] Ordenação por data de aquisição
- [x] Compartilhamento público com token
- [x] Drag-and-drop para upload
- [x] Validação de mime-type
- [x] Upload múltiplo de fotos
- [x] Paginação
- [x] Docker
- [x] Arquitetura de microsserviços

## Estrutura do Projeto

```
dr-tis/
├── frontend/                 # Next.js 14 App
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── providers/       # Query providers
│   └── Dockerfile
├── services/
│   ├── api-gateway/         # API Gateway (4000)
│   ├── auth-service/        # Auth Service (4001)
│   ├── albums-service/      # Albums Service (4002)
│   ├── photos-service/      # Photos Service (4003)
│   └── upload-service/      # Upload Service (4004)
├── packages/
│   └── shared/              # Shared types and constants
├── docs/
│   └── plans/               # Design and planning docs
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Development compose
└── pnpm-workspace.yaml      # Monorepo config
```

## Testes

```bash
# Auth Service
cd services/auth-service && npm test

# Albums Service
cd services/albums-service && npm test

# Photos Service
cd services/photos-service && npm test
```

## Troubleshooting

### Erro de conexão com PostgreSQL
Verifique se o container está rodando:
```bash
docker ps
docker-compose -f docker-compose.dev.yml logs postgres
```

### Erro de upload no MinIO
1. Verifique se o bucket `photos` existe no MinIO Console
2. Confirme as credenciais no `.env`

### Migrations não rodam
```bash
cd services/auth-service
npm run build  # Build primeiro
npm run migration:run
```

## Licença

MIT
