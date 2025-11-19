

# StockPlant

## Frameworks
- Frontend: React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui (Radix UI), TanStack Query, React Router v6
- Charts e mapas: Recharts, Plotly.js, React Leaflet
- Backend: Django 5.2, Django REST Framework, Simple JWT, django-cors-headers

## Linguagens
- Frontend: TypeScript
- Backend: Python

## Banco de Dados

- Desenvolvimento/alternativa: PostgreSQL via `DATABASE_URL` (configurado com `dj_database_url` e `DB_SCHEMA`)

## APIs
- Autenticação (`/api/auth/`)
  - `POST /api/auth/login/` — obter JWT
  - `POST /api/auth/refresh/` — renovar JWT
  - `GET /api/auth/me/` — dados do usuário autenticado
  - Admin: `GET/POST /api/auth/admin/users/`, `GET/PUT/DELETE /api/auth/admin/users/{id}/`
- Fazenda e Cultivos (`/api/farm/`)
  - `GET/POST /api/farm/fazendas/` — listar/criar fazendas do produtor
  - `GET/POST /api/farm/cultivos/` — listar/criar cultivos do produtor
  - `GET /api/farm/cultivares/?cultura=Soja` — cultivares por nome
  - `GET /api/farm/cultivares/?cultura_info_id=5` — cultivares por cultura `id`
  - `GET/POST /api/farm/culturas-info/` — culturas administradas (nome/imagem)
  - `GET /api/produtor/dashboard/` — métricas resumidas
- Estoque (`/api/`)
  - `GET /api/estoque/` — resumo de estoque do produtor
  - `POST /api/estoque/entrada/` — lançar entrada de estoque (`colheita` ou `ajuste`)
- Marketplace (`/api/marketplace/`)
  - `GET /api/marketplace/ofertas/` — ofertas públicas
  - `POST /api/marketplace/ofertas/` — criar oferta (autenticado produtor; aceita `cultivo_id`)

## APIs externas
- Mapas
  - OpenStreetMap Static Maps: `staticmap.openstreetmap.de` e `staticmap.openstreetmap.fr`
  - OpenStreetMap Embed: `www.openstreetmap.org/export/embed.html`
- Tempo
  - Open-Meteo Forecast: `https://api.open-meteo.com/v1/forecast` (campos atuais: `temperature_2m`, `precipitation`, `wind_speed_10m`)
- CEP (endereços)
  - ViaCEP: `https://viacep.com.br/ws/{cep}/json/`
  - API CEP: `https://cdn.apicep.com/file/apicep/{cep}.json`

## Regras de negócio
- Cultura como fonte única: `CulturaInfo` define nome e imagem; `Cultivar` referencia via `cultura_info` e sincroniza `cultura` com `CulturaInfo.nome`.
- Filtragem de variedades: formulários do produtor carregam cultivares pelo `cultura_info_id` selecionado (com fallback por nome).
- Validação de área: `Cultivo` não excede a área disponível da fazenda (`areacultivada` ou `areatotal`), considerando a soma por safra.
- Estoque: entradas só para produtor autenticado; colheita só pode ser lançada se a data prevista já passou.
- Oferta vinculada: ofertas podem vincular `cultivo_id` e são excluídas automaticamente ao excluir o cultivo (CASCADE).
- Leituras públicas seletivas: algumas listagens (`GET`) são públicas e retornam vazias sem autenticação; escrita permanece protegida.

## Requisitos funcionais
- Autenticação JWT com login/refresh e consulta do usuário (`/api/auth/*`).
- CRUD de fazendas do produtor e restrição por proprietário (`/api/farm/fazendas/`).
- CRUD de cultivos do produtor com validação de área e associação a fazenda (`/api/farm/cultivos/`).
- Cadastro e consulta de cultivares e culturas administradas com imagem (`/api/farm/cultivares/`, `/api/farm/culturas-info/`).
- Resumo de estoque do produtor e lançamento de entradas (`/api/estoque/`, `/api/estoque/entrada/`).
- Ofertas públicas e criação de oferta associada a cultivo (`/api/marketplace/ofertas/`).
- Dashboard do produtor com métricas e gráficos (`/api/produtor/dashboard/`).

## Requisitos não funcionais
- Segurança: JWT, CORS habilitado, permissões por papel (`IsProdutor`, `IsAuthenticated`).
- Consistência: sincronização automática de `Cultivar.cultura` com `CulturaInfo.nome`; deleções em cascata garantem integridade (cultivo → ofertas, estoque).
- Observabilidade: feedback de erros no frontend com toasts; logs de 404 em rotas.
- Desempenho: desativado `refetchOnWindowFocus` em consultas críticas; filtros server-side para listas.
- Configurabilidade: uso de variáveis de ambiente (`DATABASE_URL`, `ALLOWED_HOSTS`, `DEBUG`).
- Internacionalização/tempo: `LANGUAGE_CODE=pt-br`, `TIME_ZONE=America/Sao_Paulo`.

## Execução em desenvolvimento
- Backend: `python manage.py runserver 0.0.0.0:8000`
- Frontend: `npx vite --port 5175`
- Acesso: `http://localhost:5175/` (frontend) e `http://localhost:8000/` (API)

## Permissões
- Leitura pública para cultivares e listagens básicas (`GET` em alguns endpoints)
- Operações de escrita exigem JWT de produtor
- Ofertas vinculadas a `cultivo_id` são removidas automaticamente ao excluir o cultivo

## Variáveis de ambiente (backend)
- `DJANGO_SECRET_KEY` — chave secreta
- `DEBUG` — `True/False`
- `ALLOWED_HOSTS` — ex.: `localhost,127.0.0.1`
- `DATABASE_URL` — conexão PostgreSQL (opcional)
- `DB_SCHEMA` — schema PostgreSQL (opcional)
