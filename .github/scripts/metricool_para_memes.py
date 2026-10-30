"""Coloca na página de memes (memes/memes.json) todos os posts do Metricool.

Uso:  python .github/scripts/metricool_para_memes.py posts.json [--remover-sumidos DE ATE]

- posts.json: lista de posts como o Metricool devolve (getScheduledPosts -> "data").
- Cada post vira um item com título, legenda, vídeo ou imagens, crédito e datas.
- Aparece no site no horário de publicação (publicar_em) e sai 3 dias depois (expira).
- Posts que já estão na lista são atualizados (texto, data, mídia), sem duplicar.
- Mídia já baixada para memes/ continua sendo usada (não volta para o link externo).
- --remover-sumidos DE ATE: tira da lista os posts ainda NÃO publicados desse período
  que não existem mais no Metricool (foram apagados lá). Datas no formato AAAA-MM-DD.
"""
import json
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

ARQUIVO = "memes/memes.json"
DIAS_NO_SITE = 3
SP = ZoneInfo("America/Sao_Paulo")


def slug(t, n=48):
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:n].rstrip("-") or "post"


def limpa_linha(t):
    return re.sub(r"\s+", " ", t).strip()


def separar(texto):
    """Devolve (primeira_linha, legenda_sem_contato_e_hashtags, credito)."""
    credito = ""
    m = re.search(r"Cr[ée]ditos?:\s*(@[\w.]+)", texto)
    if m:
        credito = m.group(1)
    linhas = []
    for ln in texto.split("\n"):
        s = ln.strip()
        if re.search(r"Cr[ée]ditos?:", s):
            continue
        if s.startswith(("📲", "🌐")) or "brunoaprovaconcursos.com.br" in s or "99607-7793" in s:
            continue
        if s and all(p.startswith("#") for p in s.split()):
            continue
        linhas.append(s)
    corpo = re.sub(r"\n{3,}", "\n\n", "\n".join(linhas)).strip()
    partes = corpo.split("\n", 1)
    return partes[0].strip(), (partes[1].strip() if len(partes) > 1 else ""), credito


def item_do_post(p):
    quando = datetime.fromisoformat(p["publicationDate"]["dateTime"]).replace(tzinfo=SP)
    dia = quando.date()
    primeira, resto, credito = separar(p.get("text") or "")
    titulo_yt = ((p.get("youtubeData") or {}).get("title") or "").strip()
    if titulo_yt:
        titulo = titulo_yt
        legenda = (primeira + ("\n" + resto if resto else "")).strip()
    else:
        titulo, legenda = primeira, resto
    midia = [u for u in (p.get("media") or []) if u]
    videos = [u for u in midia if re.search(r"\.(mp4|mov|webm|m4v)(\?|$)", u, re.I)]
    imagens = [u for u in midia if u not in videos]
    item = {
        "id": f"{dia.isoformat()}-{slug(titulo)}",
        "metricool_id": p["id"],
        "titulo": titulo,
        "legenda": legenda,
    }
    if videos:
        item["video"] = videos[0]
    elif imagens:
        item["imagens"] = imagens
    item["credito"] = credito
    item["publicado"] = dia.isoformat()
    item["publicar_em"] = quando.isoformat(timespec="seconds")
    item["expira"] = (dia + timedelta(days=DIAS_NO_SITE)).isoformat()
    return item


def local(u):
    return isinstance(u, str) and u.startswith("memes/")


def juntar(atual, novo):
    """Atualiza 'atual' com 'novo', mantendo mídia que já foi baixada para memes/."""
    origem = atual.get("origem")
    for campo in ("titulo", "legenda", "credito", "publicado", "publicar_em", "expira", "metricool_id"):
        atual[campo] = novo[campo]
    tipo = "video" if "video" in novo else "imagens"
    ja_local = local(atual.get(tipo)) or (tipo == "imagens" and all(local(u) for u in atual.get("imagens") or [None]))
    mesma = origem is None or origem.get(tipo) == novo[tipo]  # sem 'origem' = colocado à mão: mantém
    if ja_local and mesma:
        return atual
    atual[tipo] = novo[tipo]
    atual.pop("video" if tipo == "imagens" else "imagens", None)
    atual.pop("capa", None)
    atual.pop("origem", None)
    return atual


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(2)
    with open(args[0], encoding="utf-8") as f:
        posts = json.load(f)
    if isinstance(posts, dict):
        posts = posts.get("data", [])
    with open(ARQUIVO, encoding="utf-8") as f:
        lista = json.load(f)

    hoje = datetime.now(SP).date().isoformat()
    por_mid = {m.get("metricool_id"): m for m in lista if m.get("metricool_id")}
    por_hora = {m.get("publicar_em"): m for m in lista if m.get("publicar_em")}
    ids = {m["id"] for m in lista}
    novos = atualizados = 0
    vistos = set()
    for p in posts:
        if p.get("draft"):
            continue
        it = item_do_post(p)
        vistos.add(it["metricool_id"])
        if it["expira"] <= hoje:
            continue  # já passou dos 3 dias: não entra
        atual = por_mid.get(it["metricool_id"]) or por_hora.get(it["publicar_em"])
        if atual:
            antes = json.dumps(atual, sort_keys=True, ensure_ascii=False)
            juntar(atual, it)
            if json.dumps(atual, sort_keys=True, ensure_ascii=False) != antes:
                atualizados += 1
            continue
        base, n = it["id"], 2
        while it["id"] in ids:
            it["id"] = f"{base}-{n}"
            n += 1
        ids.add(it["id"])
        lista.append(it)
        novos += 1

    removidos = 0
    if "--remover-sumidos" in args:
        i = args.index("--remover-sumidos")
        de, ate = args[i + 1], args[i + 2]
        agora = datetime.now(SP)
        fica = []
        for m in lista:
            futuro = m.get("publicar_em") and datetime.fromisoformat(m["publicar_em"]) > agora
            no_periodo = de <= (m.get("publicado") or "") <= ate
            if m.get("metricool_id") and futuro and no_periodo and m["metricool_id"] not in vistos:
                removidos += 1
                continue
            fica.append(m)
        lista = fica

    lista.sort(key=lambda m: m.get("publicar_em") or m.get("publicado") or "")
    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(lista, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{novos} novo(s), {atualizados} atualizado(s), {removidos} removido(s); {len(lista)} na lista.")


if __name__ == "__main__":
    main()
