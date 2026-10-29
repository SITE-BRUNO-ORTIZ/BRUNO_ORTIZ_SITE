#!/usr/bin/env bash
# Troca o site que está no ar (branch main), sem perder nada.
#
#   bash .github/scripts/trocar_site.sh novo     -> publica o site novo (branch site-novo)
#   bash .github/scripts/trocar_site.sh antigo   -> volta exatamente o site antigo (branch backup/site-antigo)
#
# Com TESTE=1 faz tudo só na máquina e mostra o que mudaria, sem enviar nada ao GitHub.
#
# Regras de segurança:
# - Antes de publicar o novo, o site que está no ar é guardado na branch backup/site-antigo
#   e numa tag com data. Só guarda se o que está no ar for mesmo o site antigo.
# - A pasta memes/ (vídeos do robô) e a pasta .github/ (estes botões) nunca são trocadas.
# - Rodar duas vezes seguidas não estraga nada: a segunda vez só avisa que já está no ar.
set -euo pipefail

ALVO="${1:-}"
TESTE="${TESTE:-0}"
MARCA="assets/app.js"   # arquivo que só existe no site novo
FICA=(":(exclude)memes" ":(exclude).github")

if [[ "$ALVO" != "novo" && "$ALVO" != "antigo" ]]; then
  echo "Uso: trocar_site.sh novo|antigo"; exit 2
fi

git config user.name  >/dev/null 2>&1 || git config user.name  "troca-de-site"
git config user.email >/dev/null 2>&1 || git config user.email "troca-de-site@users.noreply.github.com"

git fetch --quiet origin main site-novo backup/site-antigo
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

if [[ "$ALVO" == "novo" ]]; then
  if [[ -f "$MARCA" ]]; then
    echo "O site novo já está no ar. Nada a fazer."; exit 0
  fi
  # Guarda o que está no ar (site antigo) antes de trocar.
  TAG="site-antigo-$(TZ=America/Sao_Paulo date +%Y-%m-%d-%Hh%Mm%S)"
  if [[ "$TESTE" == "1" ]]; then
    echo "TESTE: guardaria o site atual em backup/site-antigo e na tag $TAG"
  else
    git push --quiet --force origin HEAD:refs/heads/backup/site-antigo
    echo "Site antigo guardado na branch backup/site-antigo"
    if git tag "$TAG" HEAD 2>/dev/null && git push --quiet origin "refs/tags/$TAG" 2>/dev/null; then
      echo "Cópia extra guardada na tag $TAG"
    fi
  fi
  ORIGEM="origin/site-novo"
  MSG="Publica o site novo"
else
  if [[ ! -f "$MARCA" ]]; then
    echo "O site antigo já está no ar. Nada a fazer."; exit 0
  fi
  ORIGEM="origin/backup/site-antigo"
  MSG="Volta o site antigo (como estava antes do site novo)"
fi

# Copia exatamente os arquivos da origem (apaga o que não existe nela), menos memes/ e .github/.
git restore --source="$ORIGEM" --staged --worktree -- . "${FICA[@]}"

# Conferência: o resultado tem de ser idêntico à origem (fora memes/ e .github/).
if ! git diff --cached --quiet "$ORIGEM" -- . "${FICA[@]}"; then
  echo "ERRO: o resultado não ficou igual a $ORIGEM. Nada foi enviado."; git diff --cached --stat "$ORIGEM" -- . "${FICA[@]}"; exit 1
fi
if [[ "$ALVO" == "novo" && ! -f "$MARCA" ]] || [[ "$ALVO" == "antigo" && -f "$MARCA" ]]; then
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
