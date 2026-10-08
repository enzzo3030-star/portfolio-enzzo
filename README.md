# Portfólio — Enzzo

Site one-page estático (HTML, CSS e JS puros). Marketing digital e automação para negócios locais · Bauru, SP.

## Estrutura

```
index.html
style.css
script.js
vercel.json            # headers de cache para /assets (opcional)
assets/fonts/          # onest-400.woff2, onest-900.woff2, jetbrains-mono-400.woff2
assets/img/            # case-1..5 (.webp/.avif), foto-enzzo (.webp/.avif), og.png
assets/apresentacao-enzzo.pdf  # apresentação para download (botão do hero)
```

## Rodar localmente

Abra `index.html` no navegador ou sirva a pasta:

```
python3 -m http.server 8000
```

Acesse http://localhost:8000.

## Antes de publicar

### Placeholders para trocar no `index.html`

Procure tudo que está entre colchetes e o número de WhatsApp:

```
grep -nE '\[[^]]*\]|55SEUNUMERO' index.html
```

**Dados pessoais**
- `[sobrenome]` — título da página, seção Sobre e rodapé (linhas 8, 434, 488).
- `[seu-dominio]` — URL canônica, `og:url` e imagens do Open Graph/Twitter (linhas 10, 18, 19, 28). Use o domínio final, ex.: `enzzo.com.br`.
- `55SEUNUMERO` — WhatsApp no formato 55 + DDD + número, só dígitos, ex.: `5514999999999` (botão do hero, contato e botão flutuante: linhas 118, 466, 494).
- `[seu_instagram]` — usuário do Instagram sem @ (linhas 131, 473).
- `[seu-email@dominio.com.br]` — e-mail de contato (linhas 469, 475).
- `[seu-linkedin]` — slug do perfil no LinkedIn (linha 474).

**Textos**
- Frase do hero `[Transformo negócios locais em ...]` — remova os colchetes ou reescreva (linha 113).
- `[um negócio real, ex: uma loja de produtos naturais]` — o negócio que você opera (linha 440).
- Números da seção Sobre: `[+15]` negócios atendidos, `[R$ 180 mil]` em anúncios, `[3 anos]` de negócio próprio (linhas 443 a 445).

**Cases (5 cards, linhas 156 a 270)**
- `[Cliente 1]` a `[Cliente 5]` e os títulos `[Cliente N — nicho]` — nome real de cada cliente.
- `[link-do-cliente-1]` a `[link-do-cliente-5]` — Instagram ou site de cada cliente.
- Resultados: `[+40%]`, `[62 pedidos]`, `[R$ 4,80]`, `[+31 agendamentos]`, `[+2.300 seguidores]`, `[3x]`, `[+58%]`, `[4,8★]`, `[−37%]`, `[1.200 cadastros]`. Troque por números reais, mesmo que pequenos.

### Outros arquivos
- `assets/img/case-1..5` e `assets/img/foto-enzzo` são placeholders. Troque pelos prints reais (1200x800) e sua foto (800x800), mantendo os nomes. Para gerar WebP/AVIF:
  ```
  pip install pillow pillow-avif-plugin
  python3 -c "from PIL import Image; import pillow_avif; im=Image.open('foto.jpg'); im.save('assets/img/foto-enzzo.webp', quality=82); im.save('assets/img/foto-enzzo.avif', quality=60)"
  ```
- `assets/apresentacao-enzzo.pdf` (6 páginas, 1280x720) também tem placeholders: `[sobrenome]`, `[Cliente 1 — Loja de beleza]`, `[Cliente 2 — Estética automotiva]`, os números dos dois cases e os contatos (`[DDD] [número]`, e-mail, Instagram, LinkedIn). Edite e reexporte no Canva/Google Slides ou peça para regenerar o PDF com os dados reais.

## Publicar na Vercel via GitHub

1. Crie um repositório no GitHub (ex.: `portfolio-enzzo`) e envie os arquivos:
   ```
   git init
   git add .
   git commit -m "Portfólio inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/portfolio-enzzo.git
   git push -u origin main
   ```
2. Acesse https://vercel.com, entre com a conta do GitHub e clique em **Add New → Project**.
3. Importe o repositório `portfolio-enzzo`. Em *Framework Preset* deixe **Other**. Não precisa de build command nem output directory.
4. Clique em **Deploy**. Em menos de um minuto o site estará em `https://portfolio-enzzo.vercel.app`.
5. A partir daí, todo `git push` na branch `main` publica automaticamente.

## Domínio próprio

1. No projeto na Vercel, vá em **Settings → Domains** e adicione seu domínio (ex.: `enzzo.com.br` e `www.enzzo.com.br`).
2. No painel do registrador (Registro.br, GoDaddy, Hostinger etc.) crie os registros DNS que a Vercel mostrar:
   - `A` para `@` apontando para `76.76.21.21`
   - `CNAME` para `www` apontando para `cname.vercel-dns.com`
   Alternativa: trocar os nameservers do domínio para `ns1.vercel-dns.com` e `ns2.vercel-dns.com` e deixar a Vercel gerenciar o DNS.
3. Aguarde a propagação (minutos a algumas horas). A Vercel emite o certificado HTTPS automaticamente.
4. Em **Settings → Domains** marque o domínio principal e redirecione o outro para ele (ex.: `www` → raiz).

## Open Graph

A imagem de preview para WhatsApp, Instagram e LinkedIn é `assets/img/og.png` (1200x630). Depois de publicar, teste em https://www.opengraph.xyz colando a URL do site. Se trocar a imagem, mantenha o nome e o tamanho.

## Cache

`vercel.json` instrui o navegador a guardar tudo em `/assets` por 1 ano. Se substituir uma imagem ou fonte mantendo o nome, visitantes antigos podem ver a versão em cache. Para forçar atualização, renomeie o arquivo (ex.: `case-1-v2.webp`) e atualize a referência no `index.html`.
