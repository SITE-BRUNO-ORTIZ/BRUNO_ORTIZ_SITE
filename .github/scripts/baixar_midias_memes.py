"""Baixa para a pasta memes/ os vídeos e imagens dos posts que estão no ar
(ou que entram no ar nas próximas 36 horas), para o site não depender de links externos.

- Vídeo sem capa ganha uma capa tirada do próprio vídeo (ffmpeg).
- Se algum download falhar, o link externo continua na lista (o site segue mostrando).
- Guarda em "origem" os links originais, para a sincronização com o Metricool saber
  que aquela mídia já foi baixada.
"""
import json
import os
import re
import subprocess
import urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

ARQUIVO = "memes/memes.json"
SP = ZoneInfo("America/Sao_Paulo")
agora = datetime.now(SP)
hoje = agora.date().isoformat()
limite = agora + timedelta(hours=36)


def externo(u):
    return isinstance(u, str) and u.startswith("http")


def baixar(url, destino_sem_ext):
    ext = os.path.splitext(url.split("?")[0])[1].lower() or ".bin"
    if ext == ".jpeg":
        ext = ".jpg"
    destino = destino_sem_ext + ext
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site Bruno Ortiz)"})
    with urllib.request.urlopen(req, timeout=120) as r, open(destino + ".tmp", "wb") as f:
        while True:
            bloco = r.read(1 << 20)
            if not bloco:
                break
            f.write(bloco)
    if os.path.getsize(destino + ".tmp") < 1000:
        os.remove(destino + ".tmp")
        raise RuntimeError("arquivo vazio")
    os.replace(destino + ".tmp", destino)
    return destino


with open(ARQUIVO, encoding="utf-8") as f:
    lista = json.load(f)

mudou = False
for m in lista:
    if m.get("expira") and m["expira"] <= hoje:
        continue
    if m.get("publicar_em") and datetime.fromisoformat(m["publicar_em"]) > limite:
        continue
    base = os.path.join("memes", re.sub(r"[^a-z0-9-]", "", m["id"].lower()))
    origem = m.get("origem") or {}
    try:
        if externo(m.get("video")):
            url = m["video"]
            m["video"] = baixar(url, base)
            origem["video"] = url
            mudou = True
            print("Vídeo baixado:", m["video"])
        if m.get("imagens") and any(externo(u) for u in m["imagens"]):
            urls = list(m["imagens"])
            novas = []
            for i, u in enumerate(urls, 1):
                novas.append(baixar(u, f"{base}-{i}") if externo(u) else u)
            m["imagens"] = novas
            origem["imagens"] = urls
            mudou = True
            print("Imagens baixadas:", len(novas), m["id"])
        if m.get("video") and not m.get("capa") and os.path.exists(m["video"]):
            capa = base + ".jpg"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1", "-i", m["video"],
                            "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "4", capa], check=True)
            m["capa"] = capa
            mudou = True
            print("Capa criada:", capa)
    except Exception as e:  # segue com o link externo
        print(f"AVISO: não consegui baixar a mídia de {m['id']}: {e}")
    if origem:
        m["origem"] = origem

if mudou:
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
        f.write("\n")
print("Pronto.")
