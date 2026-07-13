#!/usr/bin/env bash
# Instala o Docker (se necessário) e sobe o Dashboard em um container.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "$SCRIPT_DIR"

trap 'echo; echo "Falha na linha $LINENO do script. Veja a mensagem de erro acima para mais detalhes." >&2' ERR

DOCKER_CMD="docker"

install_docker_linux() {
  echo "Docker não encontrado. Instalando via script oficial (get.docker.com)..."
  curl -fsSL https://get.docker.com | sh

  if ! id -nG "$USER" | grep -qw docker; then
    sudo usermod -aG docker "$USER"
    echo "Usuário '$USER' adicionado ao grupo 'docker'."
    echo "Faça logout/login (ou rode 'newgrp docker') para usar o Docker sem sudo depois."
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  if [ "$(uname -s)" = "Linux" ]; then
    install_docker_linux
  else
    echo "Instalação automática só é suportada em Linux."
    echo "Instale o Docker Desktop manualmente: https://www.docker.com/products/docker-desktop/"
    exit 1
  fi
fi

if ! docker info >/dev/null 2>&1; then
  echo "Sem permissão para usar o Docker sem sudo nesta sessão; usando 'sudo docker'."
  DOCKER_CMD="sudo docker"
fi

if ! $DOCKER_CMD compose version >/dev/null 2>&1; then
  echo "Plugin 'docker compose' não encontrado. Instale o Docker Compose v2 e rode este script novamente."
  exit 1
fi

if [ ! -f .env ]; then
  cat > .env <<'EOF'
VT_API_KEY=

# usado apenas quando rodando com "node server.js" diretamente (sem Docker)
PORT=3000

# porta do host mapeada para o container pelo docker-compose
HOST_PORT=3000
EOF
  echo "Arquivo .env criado com valores padrão em: $SCRIPT_DIR/.env"
  echo "Edite .env e defina VT_API_KEY (ou informe a chave direto na interface web depois)."
fi

port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -Htln "sport = :$1" 2>/dev/null | grep -q .
  elif command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[.:]$1\$"
  else
    return 1
  fi
}

DEFAULT_PORT="$(grep -m1 '^HOST_PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d '[:space:]')"
DEFAULT_PORT="${DEFAULT_PORT:-3000}"

FREE_PORT="$DEFAULT_PORT"
tries=0
while port_in_use "$FREE_PORT" && [ "$tries" -lt 50 ]; do
  FREE_PORT=$((FREE_PORT + 1))
  tries=$((tries + 1))
done

if [ "$FREE_PORT" != "$DEFAULT_PORT" ]; then
  echo "Porta $DEFAULT_PORT já está em uso; usando a porta $FREE_PORT."
  if grep -q '^HOST_PORT=' .env; then
    sed -i "s/^HOST_PORT=.*/HOST_PORT=$FREE_PORT/" .env
  else
    echo "HOST_PORT=$FREE_PORT" >> .env
  fi
fi
export HOST_PORT="$FREE_PORT"

echo "Construindo a imagem e iniciando o container..."
$DOCKER_CMD compose up -d --build

echo
echo "Mirai Dashboard rodando em: http://localhost:$FREE_PORT"
echo "Ver logs:  $DOCKER_CMD compose logs -f"
echo "Parar:     ./stop.sh"
