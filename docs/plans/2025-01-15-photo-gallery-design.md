# Photo Gallery - Design Document

## Resumo

Aplicativo web responsivo de galeria de álbuns de fotos com autenticação, upload de imagens e compartilhamento público.

## Stack Tecnológica

| Aspecto | Decisão |
|---------|---------|
| Frontend | Next.js 14 + React 18 + Shadcn/ui + Tailwind |
| Backend | NestJS (microsserviços) + TypeScript |
| Banco de dados | PostgreSQL 16 |
| Armazenamento | MinIO (S3-compatível) |
| E-mail | Resend |
| OAuth | Google |
| Infra | Docker Compose |

---

## Arquitetura de Microsserviços

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

### Responsabilidades dos Serviços

- **API Gateway (4000)**: Ponto único de entrada, roteia requests, valida tokens JWT
- **Auth Service (4001)**: Cadastro, login, OAuth Google, recuperação de senha, gestão de tokens
- **Albums Service (4002)**: CRUD de álbuns, compartilhamento público com token
- **Photos Service (4003)**: CRUD de metadados de fotos, listagem, ordenação
- **Upload Service (4004)**: Upload de arquivos, extração de EXIF, detecção de cor predominante, validação mime-type, comunicação com MinIO

---

## Modelo de Dados (PostgreSQL)

### Tabela: users

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Nome do usuário |
| email | VARCHAR(255) | Email único |
| password_hash | VARCHAR(255) | Hash bcrypt (null se OAuth) |
| google_id | VARCHAR(255) | ID do Google (null se email/senha) |
| avatar_url | VARCHAR(500) | URL do avatar |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Tabela: albums

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| user_id | UUID | FK para users |
| title | VARCHAR(255) | Título do álbum |
| description | TEXT | Descrição |
| is_public | BOOLEAN | Se é público |
| public_token | VARCHAR(64) | Token de compartilhamento |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

### Tabela: photos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| album_id | UUID | FK para albums |
| title | VARCHAR(255) | Título da foto |
| description | TEXT | Descrição |
| file_key | VARCHAR(500) | Path no MinIO |
| thumbnail_key | VARCHAR(500) | Path da miniatura |
| size_bytes | BIGINT | Tamanho em bytes |
| mime_type | VARCHAR(100) | Tipo MIME |
| dominant_color | VARCHAR(7) | Cor predominante (#RRGGBB) |
| acquired_at | TIMESTAMP | Data de aquisição (EXIF ou manual) |
| created_at | TIMESTAMP | Data de criação |

### Tabela: password_resets

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Primary key |
| user_id | UUID | FK para users |
| token | VARCHAR(64) | Token único |
| expires_at | TIMESTAMP | Data de expiração |
| used_at | TIMESTAMP | Data de uso (null se não usado) |
| created_at | TIMESTAMP | Data de criação |

---

## APIs dos Microsserviços

### Auth Service (porta 4001)

```
POST   /auth/register          # Cadastro com email/senha
POST   /auth/login             # Login com email/senha
POST   /auth/google            # Login/cadastro via Google OAuth
POST   /auth/forgot-password   # Solicitar recuperação (envia email)
POST   /auth/reset-password    # Redefinir senha com token
POST   /auth/refresh           # Renovar access token
GET    /auth/me                # Dados do usuário logado
```

### Albums Service (porta 4002)

```
GET    /albums                 # Listar álbuns do usuário (paginado)
POST   /albums                 # Criar novo álbum
GET    /albums/:id             # Detalhes de um álbum
PATCH  /albums/:id             # Editar título/descrição
DELETE /albums/:id             # Excluir álbum (só se vazio)
POST   /albums/:id/share       # Gerar token de compartilhamento
DELETE /albums/:id/share       # Revogar compartilhamento
GET    /albums/shared/:token   # Acessar álbum público (sem auth)
```

### Photos Service (porta 4003)

```
GET    /photos/album/:albumId  # Listar fotos do álbum (paginado)
       ?sort=acquired_at&order=asc|desc
       ?page=1&limit=20
GET    /photos/:id             # Detalhes de uma foto
PATCH  /photos/:id             # Editar título/descrição
DELETE /photos/:id             # Excluir foto
```

### Upload Service (porta 4004)

```
POST   /upload/photo           # Upload de foto única
POST   /upload/photos          # Upload múltiplo (pasta inteira)
GET    /upload/presigned/:key  # URL assinada para download
```

---

## Estrutura do Frontend

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── albums/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── page.tsx
│   ├── shared/[token]/page.tsx
│   └── api/auth/[...nextauth]/
├── components/
│   ├── ui/
│   ├── albums/
│   ├── photos/
│   └── shared/
├── hooks/
├── lib/
└── types/
```

---

## Upload Service - Processamento de Imagens

### Fluxo de Upload

1. Validar mime-type (file-type - lê magic bytes)
2. Extrair EXIF (exifr - data/hora de aquisição)
3. Detectar cor predominante (node-vibrant)
4. Gerar thumbnail (sharp - 300x300 max)
5. Upload para MinIO (original + thumbnail)
6. Salvar metadados no PostgreSQL

### Mime-types Aceitos

- image/jpeg
- image/png
- image/gif
- image/webp
- image/heic

### Estrutura no MinIO

```
bucket: photos
├── {user_id}/
│   ├── {album_id}/
│   │   ├── {photo_id}.jpg
│   │   └── {photo_id}_thumb.jpg
```

---

## Fluxos de Autenticação

### Login/Cadastro com Email

- Hash senha com bcrypt (cost 12)
- accessToken: expira em 15 minutos
- refreshToken: expira em 7 dias, salvo no httpOnly cookie

### OAuth Google

- NextAuth.js gerencia fluxo OAuth
- Auth Service recebe google_id, email, name, avatar
- Cria usuário se não existir, ou retorna tokens se existir

### Recuperação de Senha

1. Usuário solicita com email
2. Gera token (32 bytes hex)
3. Salva em password_resets (expira em 1 hora)
4. Envia email via Resend com link
5. Usuário acessa link e define nova senha
6. Token é marcado como usado

---

## Compartilhamento Público

- Token gerado com crypto.randomBytes(32).toString('hex')
- 256 bits de entropia
- URL: /shared/{token}
- Página pública, somente leitura
- Dono pode revogar a qualquer momento

---

## Características Bônus Implementadas

| # | Feature | Status |
|---|---------|--------|
| 1 | Framework de UI (Shadcn/Tailwind) | ✅ |
| 2 | Recuperação de senha com email | ✅ |
| 3 | Validação de todos os campos | ✅ |
| 4 | OAuth com Google | ✅ |
| 5 | Detecção automática de cor | ✅ |
| 6 | Detecção automática EXIF | ✅ |
| 7 | Ordenação por data de aquisição | ✅ |
| 8 | Compartilhamento público com token | ✅ |
| 9 | Drag-and-drop para upload | ✅ |
| 10 | Validação de mime-type | ✅ |
| 11 | Upload de pasta inteira | ✅ |
| 12 | Paginação | ✅ |
| 13 | Docker | ✅ |
| 14 | Microsserviços | ✅ |
| 15 | Serverless | ⚠️ Arquitetura preparada |

---

## Bibliotecas Principais

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Shadcn/ui + Tailwind CSS
- NextAuth.js
- TanStack Query (React Query)
- React Hook Form + Zod
- react-dropzone

### Backend

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- passport-jwt
- bcrypt
- Resend

### Processamento de Imagens

- sharp
- exifr
- node-vibrant
- file-type
- @aws-sdk/client-s3
