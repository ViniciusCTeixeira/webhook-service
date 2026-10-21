# Webhook Service v3.0

<p align="center">
  <img src="public/logo.svg" width="100" height="100" alt="Webhook Service Logo" />
  <br />
  <strong>Console moderno, leve e de alta performance para captura, inspeção, replay e simulação de Webhooks com suporte a múltiplas sessões simultâneas.</strong>
</p>

---

## 🚀 Principais Funcionalidades

- **🔀 Múltiplas Sessões com URLs Próprias**: Crie quantas sessões desejar (ex.: `/w/stripe-prod`, `/w/pix-mercadopago`, `/w/whatsapp-bot`). Cada sessão possui histórico e WebSocket isolados, permitindo testar múltiplos fluxos sem misturar dados.
- **⚡ Captura em Tempo Real (Socket.IO)**: Receba e visualize payloads instantaneamente (< 5ms) sem necessidade de atualizar a página, com suporte a qualquer método HTTP (`POST`, `GET`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`, `HEAD`).
- **🎛️ Resposta Mockada Configurável por Sessão**:
  - Código HTTP de retorno customizável (200, 201, 204, 400, 500, etc.).
  - Simulação de delay / latência de rede (ex.: 500ms, 2000ms).
  - Corpo da resposta personalizado (JSON, texto puro, HTML, XML).
- **🔁 Auto-Forwarding / Proxy**: Reencaminhe automaticamente cada webhook recebido para o seu servidor local ou URL de desenvolvimento (ex.: `http://localhost:8080/api/hook`).
- **🔁 Replay / Reenvio de Webhooks**: Reenvie qualquer requisição capturada com um clique, com pré-visualização e edição de payload, método e headers.
- **🧪 Simulador de Webhooks Integrado**: Dispare requisições de teste diretamente da interface com presets prontos para:
  - **Stripe**: `checkout.session.completed`
  - **WhatsApp**: `messages.upsert`
  - **Mercado Pago**: Notificação IPN
  - **GitHub**: Evento de `push`
- **💾 Banco de Dados SQLite WAL Nativo**: Alta velocidade e zero dependências pesadas de compilação, utilizando o motor `node:sqlite` nativo do Node.js com transações ACID e migrações versionadas.
- **📊 Diagnósticos & Rede Local**: Exibição dos IPs IPv4 da máquina na rede local para testes a partir de smartphones, gateways e outros dispositivos.
- **🎨 Visual & Identidade Alinhados ao `wa-warmer`**: Dashboard em React 19, Tailwind CSS e Lucide Icons com tema escuro slate, barra de navegação responsiva, badges de métodos HTTP e nova logo/favicon unificados.

---

## 🛠️ Arquitetura do Projeto

O projeto segue a arquitetura modular e escalável do `wa-warmer`:

```
webhook-service/
├── configs/                  # Configurações Express, CORS e Runtime
│   ├── AppConfig.js
│   ├── CorsConfig.js
│   └── RuntimeConfig.js
├── database/migrations/      # Migrações versionadas para SQLite
│   └── 001_initial_schema.sql
├── data/                     # Armazenamento SQLite WAL (webhook.sqlite)
├── dashboard/                # Subaplicação frontend (React 19 + Tailwind + Vite)
│   ├── public/               # Favicon e Logo SVG idênticos
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis (Navbar, Sidebar, Modals, Badges)
│   │   ├── context/          # Gerenciamento de estado global e WebSocket
│   │   └── pages/            # Inspector, Sessions, Tester e System
│   └── vite.config.js        # Compilação para public/dashboard
├── public/dashboard/         # Artefatos de produção servidos pelo Express
├── src/
│   ├── Controllers/          # Manipuladores de requisições HTTP
│   ├── Resources/            # Regras de negócio e persistência SQL
│   ├── Routes/               # Definição e agrupamento de rotas (/w e /api/v1)
│   └── Tools/                # Ferramentas de banco, migração, logs, socket e health
├── .env.example
├── package.json              # Módulo ESM puro ("type": "module")
└── server.js                 # Ponto de entrada do servidor
```

---

## 📦 Instalação e Execução

### Pré-requisitos
- **Node.js**: Versão 22.x ou superior (recomendado 22+ para suporte nativo a `node:sqlite`).
- **Yarn**: 1.22+

### 1. Clonar e Instalar
```bash
git clone https://github.com/ViniciusCTeixeira/webhook-service.git
cd webhook-service

# Instalar dependências da API
yarn install

# Instalar dependências do Dashboard
cd dashboard && yarn install && cd ..
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Conteúdo padrão do `.env`:
```env
PORT=3000
NODE_ENV=development
DB_PATH=data/webhook.sqlite
MAX_PAYLOAD_MB=50
PUBLIC_URL=http://localhost:3000
```

### 3. Compilar o Dashboard
```bash
yarn build:dashboard
```

### 4. Iniciar o Servidor
```bash
# Modo produção
yarn start

# Modo desenvolvimento (com recarregamento automático)
yarn dev
```

Acesse o painel web em: **[http://localhost:3000](http://localhost:3000)**

---

## 📡 Como Utilizar

### 1. Enviando Webhooks para a Sessão Padrão
```bash
curl -X POST http://localhost:3000/w/default \
  -H "Content-Type: application/json" \
  -d '{"evento": "compra_aprovada", "valor": 150.00, "cliente": "Maria"}'
```

*(Compatibilidade legada: requisições enviadas para `http://localhost:3000/webhook` também são registradas automaticamente na sessão `default`).*

### 2. Enviando Webhooks para uma Sessão Específica
Se você criou uma sessão chamada `stripe`:
```bash
curl -X POST http://localhost:3000/w/stripe \
  -H "Content-Type: application/json" \
  -d '{"id": "evt_123", "type": "payment_intent.succeeded"}'
```

Se o token da sessão ainda não existir no banco de dados, o serviço criará a sessão automaticamente na primeira requisição recebida!

### 3. Subrotas Dinâmicas
Você pode enviar webhooks para subrotas adicionais mantendo o mesmo isolamento de sessão:
```bash
curl -X POST http://localhost:3000/w/stripe/v1/checkout/success -d '{"status": "ok"}'
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.
