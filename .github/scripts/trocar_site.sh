#!/usr/bin/env bash
# Troca o site que está no ar (branch main), sem perder nada.
#
#   bash .github/scripts/trocar_site.sh novo        -> publica o site novo (branch site-novo) no lugar do site antigo
#   bash .github/scripts/trocar_site.sh antigo      -> volta exatamente o site antigo (branch backup/site-antigo)
#   bash .github/scripts/trocar_site.sh atualizar   -> com o site novo no ar, publica a versão mais recente do site-novo
#                                                     (guarda antes a versão que estava no ar em backup/site-novo-anterior)
#   bash .github/scripts/trocar_site.sh anterior    -> volta a versão do site novo que estava no ar antes da última atualização
#
# Com TESTE=1 faz tudo só na máquina e mostra o que mudaria, sem enviar nada ao GitHub.
#
# Regras de segurança:
# - Antes de publicar, o que está no ar é guardado numa branch de backup.
# - A pasta memes/ (vídeos do robô) e a pasta .github/ (estes botões) nunca são trocadas.
# - Rodar duas vezes seguidas não estraga nada: a segunda vez só avisa que já está no ar.
set -euo pipefail

ALVO="${1:-}"
TESTE="${TESTE:-0}"
MARCA="assets/app.js"   # arquivo que só existe no site novo
FICA=(":(exclude)memes" ":(exclude).github")

case "$ALVO" in novo|antigo|atualizar|anterior) ;; *) echo "Uso: trocar_site.sh novo|antigo|atualizar|anterior"; exit 2;; esac

git config user.name  >/dev/null 2>&1 || git config user.name  "troca-de-site"
git config user.email >/dev/null 2>&1 || git config user.email "troca-de-site@users.noreply.github.com"

git fetch --quiet origin main site-novo backup/site-antigo
git fetch --quiet origin backup/site-novo-anterior 2>/dev/null || true
git checkout --quiet -B main origin/main

enviar() {
  if [[ "$TESTE" == "1" ]]; then
    echo "TESTE: nada foi enviado ao GitHub."; return 0
  fi
  for tentativa in 1 2 3; do
    if git push --quiet origin HEAD:main; then return 0; fi
    echo "O GitHub recusou (alguém mexeu ao mesmo tempo). Tentando de novo..."
    sleep 5
    git pull --quiet --rebase origin main
  done
  echo "Não consegui enviar depois de 3 tentativas."; exit 1
}

guardar() {  # guardar <branch>  -> guarda o que está no ar nessa branch de backup
  if [[ "$TESTE" == "1" ]]; then
    echo "TESTE: guardaria o site que está no ar em $1"; return 0
  fi
  git push --quiet --force origin "HEAD:refs/heads/$1"
  echo "Site que estava no ar guardado na branch $1"
  local TAG="$(echo "$1" | tr '/' '-')-$(TZ=America/Sao_Paulo date +%Y-%m-%d-%Hh%Mm%S)"
  if git tag "$TAG" HEAD 2>/dev/null && git push --quiet origin "refs/tags/$TAG" 2>/dev/null; then
    echo "Cópia extra guardada na tag $TAG"
  fi
}

if [[ "$ALVO" == "novo" ]]; then
  if [[ -f "$MARCA" ]]; then echo "O site novo já está no ar. Para publicar mudanças nele, use 'atualizar'."; exit 0; fi
  guardar backup/site-antigo
  ORIGEM="origin/site-novo"; MSG="Publica o site novo"
elif [[ "$ALVO" == "antigo" ]]; then
  if [[ ! -f "$MARCA" ]]; then echo "O site antigo já está no ar. Nada a fazer."; exit 0; fi
  ORIGEM="origin/backup/site-antigo"; MSG="Volta o site antigo (como estava antes do site novo)"
elif [[ "$ALVO" == "atualizar" ]]; then
  if [[ ! -f "$MARCA" ]]; then echo "O site no ar é o antigo. Use 'novo' para publicar o site novo."; exit 1; fi
  if git diff --quiet HEAD origin/site-novo -- . "${FICA[@]}"; then echo "A versão mais recente do site novo já está no ar. Nada a fazer."; exit 0; fi
  guardar backup/site-novo-anterior
  ORIGEM="origin/site-novo"; MSG="Atualiza o site novo"
else
  if ! git rev-parse --verify --quiet origin/backup/site-novo-anterior >/dev/null; then echo "Não existe versão anterior guardada."; exit 1; fi
  if git diff --quiet HEAD origin/backup/site-novo-anterior -- . "${FICA[@]}"; then echo "A versão anterior já está no ar. Nada a fazer."; exit 0; fi
  ORIGEM="origin/backup/site-novo-anterior"; MSG="Volta a versão anterior do site novo"
fi

# Copia exatamente os arquivos da origem (apaga o que não existe nela), menos memes/ e .github/.
git restore --source="$ORIGEM" --staged --worktree -- . "${FICA[@]}"

# Conferência: o resultado tem de ser idêntico à origem (fora memes/ e .github/).
if ! git diff --cached --quiet "$ORIGEM" -- . "${FICA[@]}"; then
  echo "ERRO: o resultado não ficou igual a $ORIGEM. Nada foi enviado."; git diff --cached --stat "$ORIGEM" -- . "${FICA[@]}"; exit 1
fi
if [[ "$ALVO" == "antigo" && -f "$MARCA" ]] || [[ "$ALVO" != "antigo" && ! -f "$MARCA" ]]; then
  echo "ERRO: conferência final falhou. Nada foi enviado."; exit 1
fi

echo "Arquivos que mudam:"; git diff --cached --stat | tail -n 25
if git diff --cached --quiet; then
  echo "Nada mudou."; exit 0
fi
git commit --quiet -m "$MSG"
if [[ "$TESTE" == "1" ]]; then
  echo "TESTE concluído: a troca daria certo. Nada foi enviado ao GitHub e o site não mudou."; exit 0
fi
enviar
echo "Pronto: $MSG. O Render publica sozinho em cerca de 1 minuto."
