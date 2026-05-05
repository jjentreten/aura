#!/usr/bin/env python3
"""Gera checkout-pagamento.html a partir de checkout-frete.html."""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
FRETE = os.path.join(ROOT, "checkout-frete.html")
FRAG = os.path.join(ROOT, "checkout_pagamento_form_fragment.html")
OUT = os.path.join(ROOT, "checkout-pagamento.html")

BREADCRUMB_OLD = (
    '<nav aria-label="Trilha de navegação" class="_17kya4u19 _1fragem4b _1fragemtw _1fragem3c _1fragemt6"><ol class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragem3c _1fragem4g _1fragem4l"><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h"><a href="/cart.html" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi6 s2kwpi8">Carrinho</a></span><span class="a8x1wu2 a8x1wu1 _1fragemwb _1fragem2x _1fragems2 _1fragemrs _1fragemzl _1fragemzq _1fragemzf a8x1wu9 a8x1wui a8x1wum a8x1wuk _1fragem32 a8x1wup a8x1wuo a8x1wuu a8x1wuw"><svg viewBox="0 0 14 14" focusable="false" aria-hidden="true"><use href="/cdn/shopifycloud/checkout-web/assets/c1/assets/sprite.DtH_ovcD.svg#chevronRight"></use></svg></span></li><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h"><a href="/checkout.html" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi6 s2kwpi8">Informações</a></span><span class="a8x1wu2 a8x1wu1 _1fragemwb _1fragem2x _1fragems2 _1fragemrs _1fragemzl _1fragemzq _1fragemzf a8x1wu9 a8x1wui a8x1wum a8x1wuk _1fragem32 a8x1wup a8x1wuo a8x1wuu a8x1wuw"><svg viewBox="0 0 14 14" focusable="false" aria-hidden="true"><use href="/cdn/shopifycloud/checkout-web/assets/c1/assets/sprite.DtH_ovcD.svg#chevronRight"></use></svg></span></li><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l" aria-current="step"><strong class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h">Frete</strong><span class="a8x1wu2 a8x1wu1 _1fragemwb _1fragem2x _1fragems2 _1fragemrs _1fragemzl _1fragemzq _1fragemzf a8x1wu9 a8x1wui a8x1wum a8x1wuk _1fragem32 a8x1wup a8x1wuo a8x1wuu a8x1wuw"><svg viewBox="0 0 14 14" focusable="false" aria-hidden="true"><use href="/cdn/shopifycloud/checkout-web/assets/c1/assets/sprite.DtH_ovcD.svg#chevronRight"></use></svg></span></li><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1h _19gi7yt1n _1fragem3h">Pagamento</span></li></ol></nav>'
)

BREADCRUMB_NEW = (
    '<nav aria-label="Trilha de navegação" class="_17kya4u19 _1fragem4b _1fragemtw _1fragem3c _1fragemt6"><ol class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragem3c _1fragem4g _1fragem4l"><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h"><a href="/cart.html" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi6 s2kwpi8">Carrinho</a></span><span class="a8x1wu2 a8x1wu1 _1fragemwb _1fragem2x _1fragems2 _1fragemrs _1fragemzl _1fragemzq _1fragemzf a8x1wu9 a8x1wui a8x1wum a8x1wuk _1fragem32 a8x1wup a8x1wuo a8x1wuu a8x1wuw"><svg viewBox="0 0 14 14" focusable="false" aria-hidden="true"><use href="/cdn/shopifycloud/checkout-web/assets/c1/assets/sprite.DtH_ovcD.svg#chevronRight"></use></svg></span></li><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h"><a href="/checkout.html" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi6 s2kwpi8">Informações</a></span><span class="a8x1wu2 a8x1wu1 _1fragemwb _1fragem2x _1fragems2 _1fragemrs _1fragemzl _1fragemzq _1fragemzf a8x1wu9 a8x1wui a8x1wum a8x1wuk _1fragem32 a8x1wup a8x1wuo a8x1wuu a8x1wuw"><svg viewBox="0 0 14 14" focusable="false" aria-hidden="true"><use href="/cdn/shopifycloud/checkout-web/assets/c1/assets/sprite.DtH_ovcD.svg#chevronRight"></use></svg></span></li><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h"><a href="/checkout-frete.html" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi6 s2kwpi8">Frete</a></span><span class="a8x1wu2 a8x1wu1 _1fragemwb _1fragem2x _1fragems2 _1fragemrs _1fragemzl _1fragemzq _1fragemzf a8x1wu9 a8x1wui a8x1wum a8x1wuk _1fragem32 a8x1wup a8x1wuo a8x1wuu a8x1wuw"><svg viewBox="0 0 14 14" focusable="false" aria-hidden="true"><use href="/cdn/shopifycloud/checkout-web/assets/c1/assets/sprite.DtH_ovcD.svg#chevronRight"></use></svg></span></li><li class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem5a _1fragem73 _1fragemtw _1fragem3c _1fragem4g _1fragem4l" aria-current="step"><strong class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h">Pagamento</strong></li></ol></nav>'
)

SHIPPING_ROW = (
    '<div role="row" class="_16jwovt6 _16jwovt5 _1fragem3c _1fragemtv"><div class="_16jwovtd _16jwovtc _1fragem3c _1fragemvj _1fragem4g"><div role="rowheader" class="_16jwovt8 _16jwovt7 _1fragemvi _1fragemvk _1fragemo1 _1fragemjv _1fragemlf"><span class="_19gi7yt0 _19gi7yt18 _19gi7yt1h _19gi7yt1n _1fragem3h">Forma de frete</span></div><div role="cell" class="_16jwovta _16jwovt9 _1fragemo1 _1fragemwb"><div class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem3c _1fragem4b _1fragem4q"><div class="r0qqvk1 r0qqvk0 _1fragemt6 _1fragem3c r0qqvk4 _1fragem3c _1fragem4b _1fragem4q"><p class="_1tx8jg70 _1fragemt6 _1tx8jg719 _1tx8jg71h _1tx8jg71j">Mandaê Econômico · <strong class="_19gi7yt0 _19gi7yt18 _19gi7yt1g _19gi7yt1s _19gi7yt1k _1fragemvv _1fragem3h">R$&nbsp;23,41</strong></p></div></div></div></div><div role="cell" class="_16jwovt0"><a href="/checkout-frete.html" aria-label="Alterar forma de frete" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi5 s2kwpi4 _1fragemza s2kwpi8"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h">Alterar</span></a></div></div>'
)

REVIEW_SUFFIX_OLD = (
    'aria-label="Alterar endereço de entrega" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi5 s2kwpi4 _1fragemza s2kwpi8"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h">Alterar</span></a></div></div></div></div></section>'
)

REVIEW_SUFFIX_NEW = (
    'aria-label="Alterar endereço de entrega" class="s2kwpi1 s2kwpi0 _1fragemt6 _1fragemzk _1fragemzq _1fragemze _1fragemzv _1fragemus _1fragemzw s2kwpi2 s2kwpi5 s2kwpi4 _1fragemza s2kwpi8"><span class="_19gi7yt0 _19gi7ytn _19gi7ytg _1fragemvp _19gi7yt18 _19gi7yt1g _19gi7yt1n _1fragem3h">Alterar</span></a></div></div>'
    + SHIPPING_ROW
    + '</div></div></section>'
)

FORM2_START = (
    '<div class="_1fragem32 _16s97g75z"></div><div class="_1fragem32 _1fragemt6"><form action="" method="POST" novalidate="" id="Form2"'
)

PORTAL_EMPTY = '<div id="PortalHost"></div>'
PORTAL_FORMS = (
    '<div id="PortalHost"><div id="Portal3"><form action="" method="POST" novalidate="" id="Form10" class="km09ry0 _1fragem37"></form></div><div id="Portal4"><form action="" method="POST" novalidate="" id="Form11" class="km09ry0 _1fragem37"></form></div></div>'
)

SCRIPT_OLD = """  document.querySelectorAll('form').forEach(function(form) {
    if (form.id !== 'Form2') return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      window.location.href = '/checkout-pagamento.html';
    });
  });"""

SCRIPT_NEW = """  document.querySelectorAll('form').forEach(function(form) {
    if (form.id !== 'Form9') return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      window.location.href = '/checkout-obrigado.html';
    });
  });"""


PAYMENT_CSS = """<style>
/* Classes de componentes de pagamento ausentes no CSS local */

/* Linha do item de método de pagamento: radio + label + ícones em linha */
._1u2aa6m10{display:flex!important;align-items:center;padding:1.5rem;gap:.8rem;cursor:pointer}
/* Container radio+label: ocupa o espaço restante */
._1u2aa6m1b{flex:1;min-width:0;display:flex;align-items:center;gap:.8rem}
/* Label do método: ocupa o restante dentro de _1u2aa6m1b */
._1u2aa6m15{flex:1;min-width:0}
/* Ícones de bandeiras de cartão à direita */
._1u2aa6m16{display:flex;align-items:center;gap:.4rem;flex-shrink:0}
._1u2aa6me{flex-shrink:0}
/* Container das bandeiras de cartão */
._1u2aa6mj{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
/* Container interno da seção colapsável (campos do cartão) */
._1u2aa6mm{padding:0 1.5rem 1.5rem}
._1u2aa6mr{display:flex;flex-direction:column;gap:1rem}
._1u2aa6mu{display:flex;flex-direction:column;gap:1rem}

/* Container da lista de métodos de pagamento: borda e cantos arredondados */
.yyi4nyj{border:1px solid var(--x-color-border-primary,#d9d9d9);border-radius:var(--x-border-radius-base,4px);overflow:hidden}
/* Separador entre métodos de pagamento adjacentes */
.yyi4nyc+.yyi4nyc,.yyi4nye+.yyi4nye{border-top:1px solid var(--x-color-border-primary,#d9d9d9)}

/* Radio button do método de pagamento */
._6hzjvo3{display:flex;align-items:center;flex-shrink:0}

/* Container de bandeiras de cartão (mpn0m) */
.mpn0m{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}

/* Grid de campos do cartão (validade + CVV) */
._1mrl40q0{display:grid!important}

/* Wrapper do campo protegido PCI: borda e arredondamento */
.J1Wf0.OODEB{border:1px solid var(--x-color-border-primary,#8a8a8a)!important;border-radius:var(--x-border-radius-base,4px)!important;overflow:hidden;background:#fff}

/* Ícone sobreposto ao campo (cadeado, ?) */
._4VRZE{position:absolute;right:.8rem;top:50%;transform:translateY(-50%);display:flex;align-items:center;pointer-events:none}
</style>"""


def main():
    with open(FRETE, encoding="utf-8") as f:
        html = f.read()

    html = html.replace("<title>Frete - AURA Beauty Club - checkout</title>", "<title>Pagamento - AURA Beauty Club - checkout</title>", 1)

    inj = '<link rel="stylesheet" href="/cdn/shopifycloud/checkout-web/assets/c1/assets/RuntimeExtension.DWkDBM73.css"><link rel="stylesheet" href="/cdn/shopifycloud/checkout-web/assets/c1/assets/ThankYou.DiztPZ3-.css">'
    html = html.replace(
        '<link rel="stylesheet" href="/cdn/shopifycloud/checkout-web/assets/c1/assets/LocalizationExtensionField.zKSsYRoI.css">',
        '<link rel="stylesheet" href="/cdn/shopifycloud/checkout-web/assets/c1/assets/LocalizationExtensionField.zKSsYRoI.css">' + inj,
        1,
    )

    if BREADCRUMB_OLD not in html:
        raise SystemExit("breadcrumb pattern not found")
    html = html.replace(BREADCRUMB_OLD, BREADCRUMB_NEW, 1)

    if REVIEW_SUFFIX_OLD not in html:
        raise SystemExit("review suffix not found")
    html = html.replace(REVIEW_SUFFIX_OLD, REVIEW_SUFFIX_NEW, 1)

    html = html.replace('<h1 class="_1fragemz3">Frete</h1>', '<h1 class="_1fragemz3">Pagamento</h1>', 1)

    i = html.find(FORM2_START)
    if i < 0:
        raise SystemExit("Form2 block start not found")
    j = html.find("</form>", i)
    if j < 0:
        raise SystemExit("Form2 </form> not found")
    j = j + len("</form>")
    old_form = html[i:j]
    with open(FRAG, encoding="utf-8") as f:
        frag = f.read().strip()
    html = html.replace(old_form, frag, 1)

    html = html.replace(PORTAL_EMPTY, PORTAL_FORMS, 1)

    html = html.replace(SCRIPT_OLD, SCRIPT_NEW, 1)

    html = html.replace('href="https://aurabeautyclub.com.br"', 'href="/"')

    # Remove CSS links duplicados (cada link aparece duas vezes no template base)
    import re as _re
    seen_css = set()
    def dedup_link(m):
        href = m.group(0)
        if href in seen_css:
            return ''
        seen_css.add(href)
        return href
    html = _re.sub(r'<link rel="stylesheet" href="[^"]+\.css[^"]*"[^>]*/?>',
                   dedup_link, html)

    # Injetar CSS dos componentes de pagamento antes do </head>
    html = html.replace('</head>', PAYMENT_CSS + '\n</head>', 1)

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print("Wrote", OUT, "bytes", len(html))


if __name__ == "__main__":
    main()
