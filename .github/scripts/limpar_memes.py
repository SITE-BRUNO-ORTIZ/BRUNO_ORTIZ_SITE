"""Remove da página de memes os vídeos cuja data de expiração já chegou.

Lê memes/memes.json, apaga do repositório o vídeo e a capa de cada meme
vencido e regrava a lista só com os que continuam no ar.
"""
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo

ARQUIVO = "memes/memes.json"

hoje = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%Y-%m-%d")

with open(ARQUIVO, encoding="utf-8") as f:
    memes = json.load(f)

ficam, saem = [], []
for meme in memes:
    (saem if meme.get("expira") and meme["expira"] <= hoje else ficam).append(meme)

for meme in saem:
    for campo in ("video", "capa"):
        caminho = meme.get(campo)
        if caminho and os.path.exists(caminho):
            os.remove(caminho)
            print(f"Apagado: {caminho}")

if saem:
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(ficam, f, ensure_ascii=False, indent=2)
        f.write("\n")

print(f"Hoje {hoje}: {len(saem)} meme(s) removido(s), {len(ficam)} no ar.")
