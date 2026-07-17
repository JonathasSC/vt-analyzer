# ARGUS

Dashboard para análise de arquivos com a [API v3 da VirusTotal](https://docs.virustotal.com/reference/overview): envie arquivos, acompanhe os resultados da varredura e explore estatísticas agregadas (engines mais precisas, malwares menos identificados, nomes de detecção mais comuns etc).

## Pré-requisitos

- [Docker](https://www.docker.com/products/docker-desktop/) e o plugin `docker compose` (recomendado — o `setup.sh` instala o Docker automaticamente em Linux se ele não estiver presente)
- Alternativamente, para rodar sem Docker: [Node.js](https://nodejs.org/) 22+
- Uma chave de API da VirusTotal (grátis em https://www.virustotal.com/gui/my-apikey, após criar uma conta)

## 1. Clonar o repositório

```bash
git clone https://github.com/JonathasSC/argus.git
cd argus
```

## 2. Executar

### Opção A — Docker (recomendado)

```bash
. ./setup.sh
```

O script `setup.sh`:
1. Instala o Docker automaticamente se necessário (apenas Linux).
2. Cria o arquivo `.env` com valores padrão, caso ainda não exista.
3. Verifica se a porta `3000` já está em uso e escolhe outra livre automaticamente, se preciso.
4. Builda a imagem e sobe o container com `docker compose up -d --build`.

Ao final, o dashboard estará disponível em `http://localhost:3000` (ou na porta impressa no terminal).

Para parar o container:

```bash
./stop.sh
```

### Opção B — Node.js direto (sem Docker)

```bash
npm install
cp .env.example .env
npm start
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT` no `.env`).

## 3. Configurar a chave da VirusTotal

Você pode informar a chave de API de duas formas:

- **No `.env`** (compartilhada por todos que acessam o dashboard nesta instância): edite `VT_API_KEY` no arquivo `.env` criado no passo anterior.
- **Direto na interface web** (fica salva apenas no `localStorage` do seu navegador): cole a chave no campo "Chave de API da VirusTotal" na tela de upload.

> O tier gratuito da VirusTotal permite até 4 requisições por minuto. O dashboard reaproveita relatórios já existentes para hashes já analisados antes, evitando gastar cota à toa.

## Estrutura do projeto

```
argus/
├── server.js                     # servidor Express — proxy para a API da VirusTotal
├── public/
│   ├── index.html
│   └── assets/
│       ├── css/dashboard.css
│       ├── img/logo.png
│       └── js/
│           ├── dashboard/        # estado, cálculos e renderização do dashboard
│           └── vt/               # integração com a VirusTotal (upload, polling, cache por hash)
├── setup.sh                      # sobe o projeto via Docker
├── stop.sh                       # para o container
├── Dockerfile
└── docker-compose.yml
```

## Variáveis de ambiente (`.env`)

| Variável      | Descrição                                                              |
|---------------|--------------------------------------------------------------------------|
| `VT_API_KEY`  | Chave de API da VirusTotal usada como padrão pelo servidor (opcional)    |
| `PORT`        | Porta usada ao rodar `node server.js` diretamente (sem Docker)          |
| `HOST_PORT`   | Porta do host mapeada para o container pelo `docker-compose`            |

## Comandos úteis (Docker)

```bash
docker compose logs -f   # ver logs do container
./stop.sh                 # parar o container
```
