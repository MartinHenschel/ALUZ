/**
 * ALUZ — Lógica da vitrine (script.js)
 *
 * Este módulo controla toda a interatividade do site da ALUZ (streetwear underground):
 * a navegação entre as seções da barra lateral, a listagem e a busca de produtos,
 * a página de detalhe de cada peça (com galeria de fotos e tabela de medidas),
 * o carrinho de compras (pedido finalizado pelo WhatsApp) e a animação de introdução (intro) exibida ao abrir o site.
 *
 * Os dados dos produtos ficam em um array local (`products`), e o HTML de cada tela
 * é gerado dinamicamente via template strings e injetado no DOM definido em `index.html`.
 *
 * Main functionality:
 *  - Referenciar os elementos do DOM usados pelo site (busca, grid, detalhe, views, botões)
 *  - Manter o catálogo de produtos e resolver o caminho das imagens (pasta `fotos/`)
 *  - Alternar entre as views: "Quem Somos", "Produtos", "Carrinho", "Ensaio de Fotos" e "Informações"
 *  - Renderizar a lista de produtos com filtro por texto digitado na busca
 *  - Abrir o detalhe do produto (galeria com miniaturas) e a tela de medidas
 *  - Carrinho: botões "Colocar no carrinho" e "Comprar já", tamanho, quantidade, total e finalização do pedido no WhatsApp (salvo no localStorage)
 *  - Montar os contatos da barra lateral e a view "Informações" a partir de SITE_INFO (renderStoreInfo)
 *  - Controlar o menu hambúrguer da versão mobile (abre/fecha com botão, Esc, clique fora ou ao escolher uma seção)
 *  - Controlar a intro animada (tempo, clique/tecla para pular, memória por sessão)
 */

// ================================= STEP 1: Referências ao DOM =================================
// Todos os elementos são buscados uma única vez, aqui no topo, e reutilizados pelas funções abaixo.
// Os seletores correspondem aos ids/classes declarados em index.html.

const searchInput        = document.querySelector("#search");               // Campo de pesquisa da barra lateral (filtra os produtos)
const productGrid        = document.querySelector("#product-grid");         // Container onde a lista de produtos é desenhada
const productCount       = document.querySelector("#product-count");        // Contador "N PEÇAS" no cabeçalho do catálogo
const productDetail      = document.querySelector("#product-detail");       // Container da página de detalhe / medidas de um produto
const aboutView          = document.querySelector("#about-view");           // View "Quem Somos"
const catalogView        = document.querySelector("#catalog-view");         // View "Produtos" (catálogo)
const photoshootView     = document.querySelector("#photoshoot-view");      // View "Ensaio de Fotos"
const infoView           = document.querySelector("#info-view");            // View "Informações"
const infoContent        = document.querySelector("#info-content");         // Container dos blocos da view "Informações" (preenchido por renderStoreInfo)
const sidebarContact     = document.querySelector("#sidebar-contact");      // Links de contato no fim da barra lateral (preenchido por renderStoreInfo)
const sideSectionButtons = document.querySelectorAll(".side-section-button"); // Botões de navegação da barra lateral (um por view)
const brandButton        = document.querySelector(".brand");                // Logo da marca (clicar leva de volta ao "Quem Somos")
const sidebar            = document.querySelector(".sidebar");              // Barra lateral (no celular vira a barra do topo; recebe a classe "menu-open")
const menuToggle         = document.querySelector(".menu-toggle");          // Botão hambúrguer (visível só em telas até 900px)
const cartView           = document.querySelector("#cart-view");            // View "Carrinho"
const cartContent        = document.querySelector("#cart-content");         // Container dos itens e do resumo do pedido (preenchido por renderCart)
const cartBadge          = document.querySelector("#cart-badge");           // Contador de unidades ao lado de "Carrinho" no menu

// Número de WhatsApp da loja, no formato internacional (55 = Brasil, 47 = DDD) e sem símbolos.
// É usado para montar o link wa.me com o pedido do carrinho em getOrderLink().
const WHATSAPP_NUMBER = "5547989288039";

// Informações da loja exibidas na barra lateral e na view "Informações".
// Preencha os campos abaixo; o que ficar vazio simplesmente não aparece no site.
const SITE_INFO = {
  instagram : "aluzlab",   // usuário do Instagram, com ou sem @ (ex.: "aluz.streetwear") -> aparece um botão "Instagram"
  payment   : [],   // formas de pagamento (ex.: ["Pix", "Cartão de crédito em até 3x"]) -> bloco "Pagamento"
  shipping  : "",   // como e quanto tempo leva o envio (ex.: "Enviamos para todo o Brasil pelos Correios. Prazo e frete combinados no WhatsApp.") -> bloco "Envio"
  returns   : ""    // política de trocas e devoluções (aceita "\n" para quebrar linha) -> bloco "Trocas e devoluções"
};

// ---------------------------------- Frete (calculado pelo CEP do cliente) ----------------------------------
// O CEP é consultado no ViaCEP (serviço gratuito) para descobrir cidade e estado; o valor vem desta tabela, por região.
// ATENÇÃO: os valores abaixo são EXEMPLOS. Troque pelos preços que você realmente paga/cobra nos Correios ou transportadora.
const SHIPPING = {
  originUF : "SC",   // estado de onde a ALUZ envia (usa a linha "mesmoEstado")
  freeAbove: 0,      // frete grátis para compras a partir deste valor em R$ (0 = nunca é grátis). Ex.: 300
  rates: {
    mesmoEstado: { price: 18, days: "2 a 4 dias úteis" },
    sul        : { price: 25, days: "3 a 6 dias úteis" },
    sudeste    : { price: 35, days: "4 a 8 dias úteis" },
    centroOeste: { price: 45, days: "5 a 9 dias úteis" },
    nordeste   : { price: 55, days: "7 a 12 dias úteis" },
    norte      : { price: 65, days: "8 a 14 dias úteis" }
  }
};

// Região de cada estado (usada para escolher a linha da tabela acima)
const UF_REGION = {
  PR: "sul", SC: "sul", RS: "sul",
  SP: "sudeste", RJ: "sudeste", MG: "sudeste", ES: "sudeste",
  DF: "centroOeste", GO: "centroOeste", MT: "centroOeste", MS: "centroOeste",
  BA: "nordeste", SE: "nordeste", AL: "nordeste", PE: "nordeste", PB: "nordeste", RN: "nordeste", CE: "nordeste", PI: "nordeste", MA: "nordeste",
  AM: "norte", PA: "norte", AC: "norte", RO: "norte", RR: "norte", AP: "norte", TO: "norte"
};

// Nome por extenso de cada estado (mostrado na tela de finalização)
const UF_NAMES = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba",
  PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
};

// ================================= STEP 2: Catálogo de produtos =================================
/**
 * Estrutura de um produto (todos os campos são strings, exceto `gallery`):
 *
 * @typedef  {Object}   Product
 * @property {string}   name               Nome exibido da peça (também usado na mensagem do WhatsApp)
 * @property {string}   category           Categoria (ex.: "camiseta", "acessório", "casaco"); também define a classe do desenho placeholder `garment-<categoria>`
 * @property {string}   color              Cor da peça (aparece na linha de categoria e no rodapé do card)
 * @property {string}   [price]            Preço já formatado, ou texto como "a informar"; ignorado quando `soldOut` é true (o site mostra "VENDIDO")
 * @property {boolean}  [soldOut]          Peça vendida: troca o botão de compra por "PEÇA VENDIDA", mostra o selo VENDIDO e esmaece a foto
 * @property {string}   [image]            Arquivo da foto principal (usada na listagem); sem ela, um desenho placeholder é exibido
 * @property {string[]} [gallery]          Fotos do detalhe; a primeira é a foto principal e as demais viram miniaturas
 * @property {string}   [measureImage]     Imagem de referência de medidas (opcional)
 * @property {Object<string, Object<string, number>>} [measures]  Tabela de medidas em cm, por tamanho e por medida.
 *                                         Ex.: { P: { largura: 52, altura: 68 }, M: { largura: 56, altura: 72 } }
 *                                         Cada peça tem as suas (ex.: calça -> { cintura: 38, comprimento: 100 }).
 *                                         O botão "VER MEDIDAS" aparece se existir `measures` ou `measureImage`.
 * @property {string}   description        Texto exibido na listagem/detalhe (aceita "\n", pois o CSS usa `white-space: pre-line`)
 * @property {string}   [measureDescription] Texto de composição/tecido exibido na tela de medidas
 */

/** @type {Product[]} Lista de peças do catálogo. Para cadastrar um produto novo, basta adicionar um objeto aqui. */
const products = [
  {
    name               : "Camisa polo “EQU1L1BR1UM” V2",
    category           : "camiseta",
    color              : "Preto / Branco",
    price              : "R$ 220,00",
    image              : "camiseta ying yang.png",
    gallery            : ["camiseta ying yang.png", "ensaio ft 1.png", "ensaio ft 3.png"],
    measureImage       : "polo_medidas.png",
    measures           : {
      P  : { largura: 52, altura: 68 },
      M  : { largura: 56, altura: 72 },
      G  : { largura: 60, altura: 76 },
      GG : { largura: 64, altura: 80 }
    },
    description        : "Camisa polo “EQU1L1BR1UM” V2\nConferir Tamanhos Disponíveis\nPREÇO R$220,00",
    measureDescription : "Camisa feita de malha ponto de Roma com 92% viscose e 7% elastano para um melhor caimento e conforto durante o uso. Patchwork desfiados com estampas em silk-screen na parte frontal e nas costas. Contendo também em toda a camisa costuras duplas para maior resistência e durabilidade. Podendo ocorrer pequenas variações de uma peça para outra."
  },
  {
    name        : "Boné Jeans",
    category    : "acessório",
    soldOut     : true,
    color       : "Jeans",
    image       : "bone jeans.png",
    gallery     : ["bone jeans.png", "ensaio ft 2.png"],
    description : "CADET-CAP UPCYCLING 1/1\nTAM: regulável"
  },
  {
    name     : "Jaqueta Moletom",
    category : "casaco",
    color    : "Preto",
    price    : "a informar",
    image    : "jaqueta moletom.PNG"
  }
];

// ================================= STEP 3: Caminho das imagens =================================
// pasta onde ficam as fotos (mude aqui se renomear a pasta)
const IMG_DIR = "fotos/";

/**
 * Prefixa o nome de um arquivo de imagem com a pasta de fotos.
 *
 * Mantém valores vazios (undefined/null/"") intactos, para que produtos sem
 * `measureImage`, por exemplo, continuem sem imagem em vez de virar "fotos/undefined".
 *
 * @param {string|undefined} file - Nome do arquivo (ex.: "bone jeans.png")
 * @returns {string|undefined} Caminho completo (ex.: "fotos/bone jeans.png") ou o próprio valor vazio
 */
const withDir = (file) => (file ? IMG_DIR + file : file);

// Normaliza todos os produtos uma única vez na carga da página:
// troca os nomes de arquivo por caminhos completos (image, measureImage e cada item de gallery).
products.forEach((product) => {
  product.image = withDir(product.image);
  product.measureImage = withDir(product.measureImage);
  if (product.gallery) product.gallery = product.gallery.map(withDir);
});

// ================================= STEP 4: Navegação entre views =================================

/**
 * Exibe uma das views do site e destaca o botão correspondente na barra lateral.
 *
 * Usa o atributo `hidden` para mostrar apenas a view pedida. Ao entrar em "pronto-entrega"
 * (a view de Produtos), fecha qualquer detalhe aberto e redesenha a lista, de modo que
 * o usuário sempre veja o catálogo "limpo" ao voltar para a seção.
 *
 * Args:
 * @param {"quem-somos"|"pronto-entrega"|"carrinho"|"ensaio-fotos"|"informacoes"} viewName - Identificador da view (valor do `data-view` dos botões)
 *
 * @returns {void}
 *
 * Side Effects:
 *  - Altera `hidden` das views
 *  - Alterna a classe `active` nos botões da barra lateral
 *  - Pode chamar closeProductDetail() e renderProducts() (que alteram o DOM)
 */
function showView(viewName) {
  // Cada view fica oculta, exceto a que corresponde ao nome recebido
  aboutView.hidden = viewName !== "quem-somos";
  catalogView.hidden = viewName !== "pronto-entrega";
  photoshootView.hidden = viewName !== "ensaio-fotos";
  infoView.hidden = viewName !== "informacoes";
  cartView.hidden = viewName !== "carrinho";

  // Marca como ativo apenas o botão da barra lateral cuja view está aberta
  sideSectionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  // Ao abrir o catálogo: garante que nenhum detalhe esteja aberto e redesenha a lista
  if (viewName === "pronto-entrega") {
    closeProductDetail();
    renderProducts();
  }

  // Ao abrir o carrinho: redesenha os itens (o conteúdo pode ter mudado desde a última visita)
  if (viewName === "carrinho") renderCart();
}

/**
 * Fecha a página de detalhe (ou de medidas) e volta para a lista de produtos.
 *
 * Desfaz tudo o que openProductDetail() / openMeasures() ligaram: esconde o painel de detalhe,
 * remove o modo "measure-view" e o título extra de medidas, mostra novamente a grade de produtos
 * e o cabeçalho padrão do catálogo ("PRODUTOS" + contador).
 *
 * @returns {void}
 *
 * Side Effects:
 *  - Altera `hidden`/classes de `productDetail` e `productGrid`
 *  - Remove o elemento `.measure-heading` do DOM, se existir
 *  - Reexibe `.catalog-heading`
 */
function closeProductDetail() {
  productDetail.hidden = true;
  productDetail.classList.remove("visible");
  productGrid.hidden = false;
  catalogView.classList.remove("measure-view");
  catalogView.querySelector(".measure-heading")?.remove(); // "?." evita erro quando o título de medidas não existe
  catalogView.querySelector(".catalog-heading").hidden = false;
}

// ================================= STEP 5: Link do WhatsApp =================================

/**
 * Monta o link que abre a conversa da loja no WhatsApp com o pedido já escrito.
 * Formato `wa.me/<numero>?text=<mensagem>`; a mensagem é codificada com encodeURIComponent
 * para preservar acentos, aspas, quebras de linha e espaços na URL.
 *
 * @param {string} message - Texto do pedido (montado em checkout())
 * @returns {string} URL completa que abre a conversa no WhatsApp
 */
const getOrderLink = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// ================================= STEP 5.1: Auxiliares de venda e medidas =================================

/**
 * Texto do preço exibido no rodapé do card/detalhe.
 * Peça vendida sempre mostra "VENDIDO", independentemente do campo `price`.
 *
 * @param {Product} product
 * @returns {string}
 */
const getPriceLabel = (product) => (product.soldOut ? "VENDIDO" : product.price || "");

/**
 * Botões de compra de um produto: "COLOCAR NO CARRINHO" e "COMPRAR JÁ".
 * Os cliques são tratados por um único listener no document (STEP 8.2), via `data-cart-action`;
 * `data-product-index` é a posição do produto em `products`.
 * Vendido -> botão desativado (sem ação), para ninguém iniciar uma compra impossível.
 *
 * @param {Product} product
 * @returns {string} HTML dos botões
 */
function getBuyButtonHTML(product) {
  if (product.soldOut) {
    return '<span class="whatsapp-button is-sold-out" aria-disabled="true">PEÇA VENDIDA</span>';
  }
  const index = products.indexOf(product);
  return `<div class="buy-actions">
    <button class="cart-button" type="button" data-cart-action="add" data-product-index="${index}">COLOCAR NO CARRINHO</button>
    <button class="buy-now-button" type="button" data-cart-action="buy" data-product-index="${index}">COMPRAR JÁ</button>
  </div>`;
}

/**
 * Tamanhos disponíveis de um produto (as chaves de `measures`, ex.: ["P", "M", "G", "GG"]).
 *
 * @param {Product} product
 * @returns {string[]} Lista vazia quando a peça não tem tamanhos (ex.: boné regulável)
 */
function getSizes(product) {
  return Object.keys(product.measures || {});
}

/**
 * Seletor de tamanho exibido no detalhe e na tela de medidas (vazio se a peça não tem tamanhos ou está vendida).
 * Os cliques nos botões `.size-chip` são tratados no listener do STEP 8.2.
 *
 * @param {Product} product
 * @returns {string} HTML do seletor ou string vazia
 */
function getSizePickerHTML(product) {
  const sizes = getSizes(product);
  if (sizes.length === 0 || product.soldOut) return "";
  return `<div class="size-picker" role="group" aria-label="Escolha o tamanho">
      <span class="size-picker-label">Tamanho</span>
      ${sizes.map((size) => `<button class="size-chip" type="button" data-size="${size}" aria-pressed="false">${size}</button>`).join("")}
      <p class="size-hint" role="alert" hidden>Escolha um tamanho para continuar.</p>
    </div>`;
}

/**
 * Selo "VENDIDO" que fica sobre a foto (vazio quando a peça está disponível).
 *
 * @param {Product} product
 * @returns {string} HTML do selo ou string vazia
 */
const getSoldBadgeHTML = (product) => (product.soldOut ? '<span class="sold-badge">VENDIDO</span>' : "");

/**
 * Indica se o produto tem algo para mostrar na tela de medidas (tabela e/ou imagem de referência).
 *
 * @param {Product} product
 * @returns {boolean}
 */
const hasMeasures = (product) => Boolean(product.measureImage || product.measures);

/**
 * Monta a tabela de medidas a partir de `product.measures`.
 * Uma coluna por tamanho; dentro dela, uma linha por medida (ex.: LARGURA 52 cm).
 * Produto sem `measures` não gera tabela (retorna string vazia).
 *
 * @param {Product} product
 * @returns {string} HTML da tabela ou string vazia
 */
function getMeasureTableHTML(product) {
  const sizes = Object.entries(product.measures || {});
  if (sizes.length === 0) return "";

  const columns = Math.min(sizes.length, 4); // mais de 4 tamanhos quebram para a linha de baixo
  const cells = sizes.map(([size, values]) => `
        <div>
          <span>${size}</span>
          ${Object.entries(values).map(([label, cm]) => `<strong>${label.toUpperCase()} ${cm} cm</strong>`).join("")}
        </div>`).join("");

  return `<div class="measure-table" style="--cols:${columns}" aria-label="Tabela de medidas">${cells}
      </div>`;
}

// ================================= STEP 6: Detalhe do produto =================================

/**
 * Abre a página de detalhe de um produto (galeria de fotos, informações e botões de ação).
 *
 * Substitui a lista pela tela de detalhe: foto principal, miniaturas clicáveis (quando há
 * mais de uma foto), categoria/cor, nome, descrição, botão "VER MEDIDAS" (somente se o produto
 * tem `measureImage`), seletor de tamanho, botões "Colocar no carrinho" / "Comprar já" e rodapé com cor e preço.
 * Quando o produto não tem nenhuma foto, mostra um desenho placeholder da peça com o texto "ALUZ".
 *
 * @param {Product} product - Produto a ser exibido
 * @returns {void}
 *
 * Side Effects:
 *  - Reescreve o `innerHTML` de `productDetail`
 *  - Esconde a grade de produtos e o cabeçalho do catálogo
 *  - Registra listeners de clique (voltar, ver medidas, miniaturas)
 */
function openProductDetail(product) {
  // Sai do modo de medidas (caso venha de openMeasures) e esconde o cabeçalho padrão do catálogo
  catalogView.classList.remove("measure-view");
  catalogView.querySelector(".measure-heading")?.remove();
  catalogView.querySelector(".catalog-heading").hidden = true;

  // Lista de fotos do detalhe: usa a galeria, ou apenas a imagem principal, ou nada
  const gallery = product.gallery || (product.image ? [product.image] : []);

  // Foto principal = primeira da galeria; sem fotos, usa o desenho placeholder da categoria
  const image = gallery.length
    ? `<img src="${gallery[0]}" alt="${product.name}">`
    : `<div class="garment garment-${product.category}" aria-hidden="true">
         <span class="garment-label">ALUZ</span>
       </div>`;

  // Monta todo o HTML do detalhe de uma vez e injeta no container
  productDetail.innerHTML = `
    <div class="detail-gallery">
      <div class="detail-image${product.soldOut ? " is-sold-out" : ""}">${image}${getSoldBadgeHTML(product)}</div>
      ${gallery.length > 1 ? `
        <div class="detail-thumbnails" aria-label="Fotos de ${product.name}">
          ${gallery.map((photo, index) => `
            <button class="detail-thumbnail${index === 0 ? " active" : ""}" type="button" data-photo-index="${index}" aria-label="Ver foto ${index + 1} de ${product.name}" aria-pressed="${index === 0}">
              <img src="${photo}" alt="">
            </button>
          `).join("")}
        </div>
      ` : ""}
    </div>
    <div class="detail-info">
      <button class="detail-back" type="button">‹ Todas as peças</button>
      <div class="detail-copy">
        <p class="detail-category">${product.category} / ${product.color || ""}</p>
        <h2>${product.name}</h2>
        <p class="product-description">${product.description || ""}</p>
      </div>
      ${hasMeasures(product) ? '<button class="measure-button detail-measure-button" type="button">VER MEDIDAS</button>' : ""}
      ${getSizePickerHTML(product)}
      ${getBuyButtonHTML(product)}
      <div class="detail-meta">
        <span>${product.color || ""}</span>
        <span>${getPriceLabel(product)}</span>
      </div>
    </div>
  `;

  // Mostra o painel de detalhe e esconde a lista de produtos
  productDetail.hidden = false;
  productDetail.classList.add("visible");
  productGrid.hidden = true;

  // Os botões acima foram criados agora (via innerHTML), então os listeners são ligados aqui
  productDetail.querySelector(".detail-back").addEventListener("click", closeProductDetail);
  productDetail.querySelector(".detail-measure-button")?.addEventListener("click", () => openMeasures(product));

  // Miniaturas: ao clicar, troca a foto principal e atualiza o estado "ativo" das miniaturas
  productDetail.querySelectorAll(".detail-thumbnail").forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      const photo = gallery[Number(thumbnail.dataset.photoIndex)];     // Foto correspondente à miniatura clicada
      const mainImage = productDetail.querySelector(".detail-image img"); // <img> da foto principal
      if (!photo || !mainImage) return;                                // Segurança: nada a fazer se faltar algum dos dois
      mainImage.src = photo;

      // Destaca somente a miniatura clicada (classe visual + aria-pressed para leitores de tela)
      productDetail.querySelectorAll(".detail-thumbnail").forEach((button) => {
        const isActive = button === thumbnail;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    });
  });
}

// ================================= STEP 7: Tela de medidas =================================

/**
 * Abre a tela de medidas de um produto (imagem de referência, tabela de tamanhos e descrição técnica).
 *
 * Só funciona para produtos com `measures` ou `measureImage`. Troca o cabeçalho do catálogo por um título
 * com o nome da peça e exibe a tabela montada a partir de `product.measures` (cada peça tem a sua própria).
 * O botão "Voltar ao produto" retorna para openProductDetail().
 *
 * @param {Product} product - Produto cujas medidas serão exibidas
 * @returns {void}
 *
 * Side Effects:
 *  - Adiciona a classe `measure-view` ao catálogo e insere um `.measure-heading` no DOM
 *  - Reescreve o `innerHTML` de `productDetail`
 *  - Registra o listener do botão "Voltar ao produto"
 */
function openMeasures(product) {
  if (!hasMeasures(product)) return; // Produto sem medidas cadastradas: nada a mostrar

  // Imagem de referência: a imagem de medidas; sem ela, a foto principal (ou o desenho placeholder da categoria)
  const referenceImage = product.measureImage || (product.gallery && product.gallery[0]) || product.image;
  const referenceHTML = referenceImage
    ? `<img src="${referenceImage}" alt="${product.measureImage ? "Tabela de referência de medidas para " : "Foto de "}${product.name}">`
    : `<div class="garment garment-${product.category}" aria-hidden="true"><span class="garment-label">ALUZ</span></div>`;

  // Ativa o modo de medidas e substitui qualquer título de medidas anterior por um novo
  catalogView.classList.add("measure-view");
  catalogView.querySelector(".measure-heading")?.remove();
  const measureHeading = document.createElement("div");
  measureHeading.className = "measure-heading";
  measureHeading.innerHTML = `<h1>${product.name}</h1>`;
  catalogView.insertBefore(measureHeading, productDetail); // O título entra logo acima do painel de detalhe

  productDetail.innerHTML = `
    <div class="detail-image${product.soldOut ? " is-sold-out" : ""}">${referenceHTML}${getSoldBadgeHTML(product)}</div>
    <div class="detail-info">
      <button class="detail-back" type="button">‹ Voltar ao produto</button>
      <div class="detail-copy">
        <p class="product-description">${product.measureDescription || ""}</p>
      </div>
      ${getMeasureTableHTML(product)}
      ${getSizePickerHTML(product)}
      ${getBuyButtonHTML(product)}
      <div class="detail-meta">
        <span>${product.color || ""}</span>
        <span>${getPriceLabel(product)}</span>
      </div>
    </div>
  `;

  // Exibe o painel e esconde a lista de produtos
  productDetail.hidden = false;
  productDetail.classList.add("visible");
  productGrid.hidden = true;

  // "Voltar ao produto" reabre o detalhe do mesmo produto
  productDetail.querySelector(".detail-back").addEventListener("click", () => openProductDetail(product));
}

// ================================= STEP 8: Lista de produtos e busca =================================

/**
 * Normaliza um texto para comparação na busca: minúsculas, sem acentos e sem espaços nas pontas.
 *
 * Assim "acessorio" encontra "acessório" e "CAMISA" encontra "camisa".
 *
 * @param {string} text - Texto original (nome do produto, termo digitado etc.)
 * @returns {string} Texto normalizado
 */
const normalizeText = (text) =>
  String(text ?? "")
    .normalize("NFD")                 // separa letra + acento (ex.: "é" -> "e" + "´")
    .replace(/[\u0300-\u036f]/g, "") // remove os acentos
    .toLowerCase()
    .trim();

/**
 * Desenha a lista de produtos no catálogo, respeitando o texto digitado na busca.
 *
 * Filtra `products` comparando o termo (sem diferenciar maiúsculas/minúsculas) com
 * nome + categoria + cor de cada peça. Atualiza o contador de peças, gera um card por produto
 * (foto, categoria/cor, nome, descrição, botões "VER PRODUTO", "COLOCAR NO CARRINHO" e "COMPRAR JÁ", rodapé)
 * e, por fim, liga os cliques que abrem o detalhe. Se nada for encontrado, mostra uma mensagem.
 *
 * @returns {void}
 *
 * Side Effects:
 *  - Atualiza o texto de `productCount`
 *  - Reescreve o `innerHTML` de `productGrid`
 *  - Registra listeners de clique nos botões e nas fotos dos cards
 */
function renderProducts() {
  // Termo de busca normalizado: sem espaços nas pontas e em minúsculas
  const term = normalizeText(searchInput.value);

  // Mantém apenas os produtos que combinam com a busca (busca vazia = todos)
  const visibleProducts = products.filter((product) => {
    const matchesSearch = term === "" ||
      normalizeText(`${product.name} ${product.category} ${product.color}`).includes(term);
    return matchesSearch;
  });

  productCount.textContent = visibleProducts.length;

  // Gera o HTML de todos os cards de uma vez
  productGrid.innerHTML = visibleProducts.map((product) => {
    // Foto da listagem; sem foto, usa o desenho placeholder da categoria
    const image = product.image
      ? `<img src="${product.image}" alt="${product.name}">`
      : `<div class="garment garment-${product.category}" aria-hidden="true">
           <span class="garment-label">ALUZ</span>
         </div>`;

    return `
      <article class="product-listing${product.soldOut ? " is-sold-out" : ""}">
        <div class="listing-image">${image}${getSoldBadgeHTML(product)}</div>
        <div class="listing-info">
          <p class="detail-category">${product.category} / ${product.color}</p>
          <h2>${product.name}</h2>
          <p class="product-description">${product.description || ""}</p>
          <div class="listing-actions">
            <button class="product-open-button" type="button">VER PRODUTO</button>
            ${getBuyButtonHTML(product)}
          </div>
          <div class="detail-meta">
            <span>${product.color}</span>
            <span>${getPriceLabel(product)}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Estado vazio: nenhum produto passou pelo filtro
  if (visibleProducts.length === 0) {
    productGrid.innerHTML = '<p class="empty-state">Nenhuma peça encontrada.</p>';
  }

  // Liga os cliques dos cards recém-criados. O índice do card é o mesmo de `visibleProducts`,
  // então é possível recuperar o produto correspondente a cada card.
  productGrid.querySelectorAll(".product-listing").forEach((card, index) => {
    const product = visibleProducts[index];
    const openButton = card.querySelector(".product-open-button");
    const listingImage = card.querySelector(".listing-image");

    openButton?.addEventListener("click", () => openProductDetail(product));

    // A foto também é clicável e abre o mesmo detalhe do botão "VER PRODUTO"
    listingImage.style.cursor = "pointer";
    listingImage.addEventListener("click", () => openProductDetail(product));
  });
}

// ================================= STEP 8.1: Informações da loja e contato =================================

/**
 * Escapa caracteres especiais de HTML (&, <, >, ") de um texto vindo de SITE_INFO,
 * para que ele seja exibido como texto e nunca interpretado como código.
 *
 * @param {string} text
 * @returns {string}
 */
const escapeHTML = (text) =>
  String(text).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

/**
 * Monta os contatos da barra lateral e os blocos da view "Informações" a partir de SITE_INFO.
 *
 * - Barra lateral: botão de WhatsApp (sempre) e de Instagram (se `instagram` estiver preenchido).
 * - View "Informações": "Como comprar" (sempre) e, só se preenchidos, "Pagamento", "Envio" e
 *   "Trocas e devoluções"; no fim, os mesmos botões de contato.
 *
 * Roda uma vez, na carga da página.
 *
 * @returns {void}
 *
 * Side Effects:
 *  - Reescreve o `innerHTML` de `sidebarContact` e de `infoContent`
 */
function renderStoreInfo() {
  const linkAttrs = 'target="_blank" rel="noopener noreferrer"';
  const instagram = SITE_INFO.instagram.trim().replace(/^@/, "");

  // Botões de contato (reaproveitados na barra lateral e no fim da view "Informações")
  const contactLinks = [
    `<a href="https://wa.me/${WHATSAPP_NUMBER}" ${linkAttrs}>WhatsApp</a>`,
    instagram ? `<a href="https://instagram.com/${encodeURIComponent(instagram)}" ${linkAttrs}>Instagram</a>` : ""
  ].join("");

  sidebarContact.innerHTML = `
    <p class="sidebar-contact-title">Fale com a gente</p>
    <div class="sidebar-contact-links">${contactLinks}</div>
  `;

  // Cada bloco é [título, HTML do conteúdo]; só entram os que têm informação
  const blocks = [
    ["Como comprar", `
      <ol>
        <li>Escolha a peça no catálogo.</li>
        <li>Toque em “Colocar no carrinho” (ou em “Comprar já” para ir direto ao pedido).</li>
        <li>No carrinho, confira tamanhos e quantidades e calcule o frete com o seu CEP.</li>
        <li>Toque em “Finalizar pedido”, informe nome, CPF, endereço e telefone: o WhatsApp abre com o pedido pronto.</li>
        <li>Combinamos o pagamento por lá.</li>
      </ol>`]
  ];
  if (SITE_INFO.payment.length) {
    blocks.push(["Pagamento", `<ul>${SITE_INFO.payment.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`]);
  }
  if (SITE_INFO.shipping.trim()) {
    blocks.push(["Envio", `<p>${escapeHTML(SITE_INFO.shipping.trim())}</p>`]);
  }
  if (SITE_INFO.returns.trim()) {
    blocks.push(["Trocas e devoluções", `<p>${escapeHTML(SITE_INFO.returns.trim())}</p>`]);
  }
  blocks.push(["Contato", `<div class="info-links">${contactLinks}</div>`]);

  infoContent.innerHTML = blocks
    .map(([title, body]) => `<section class="info-block"><h2>${title}</h2>${body}</section>`)
    .join("");
}

renderStoreInfo();

// ================================= STEP 8.2: Carrinho de compras =================================
// O carrinho guarda só { name, size, qty } e fica salvo no localStorage (sobrevive ao fechar a aba).
// Preço, foto e tamanhos válidos são sempre lidos de `products`, então mudar o catálogo atualiza o carrinho.
// A compra termina no WhatsApp: "Finalizar pedido" abre a conversa da loja com a lista dos itens e o total.

const CART_KEY = "aluzCart";  // chave do localStorage
const MAX_QTY = 10;           // limite de unidades por item
let cartCep = "";             // CEP digitado no resumo, já com máscara (mantido ao redesenhar o carrinho)
let cartShipping = null;      // resultado do cálculo: { cep, street, neighborhood, city, uf, price, days } ou null
let cartShippingLoading = false; // true enquanto consulta o CEP
let cartShippingMsg = "";     // mensagem de erro do cálculo de frete
// Dados digitados na tela de finalização (só em memória, nunca salvos). `cep` guarda de qual CEP vieram rua/bairro sugeridos.
let checkoutData = { name: "", surname: "", cpf: "", email: "", phone: "", street: "", number: "", complement: "", neighborhood: "", cep: "" };
let toastTimer;               // timer do aviso "no carrinho"

/** Acha o produto pelo nome (o nome é o identificador usado no carrinho). */
const findProduct = (name) => products.find((product) => product.name === name);

/**
 * Converte um texto de preço em número: "R$ 220,00" -> 220. Retorna null quando não há valor ("a informar").
 *
 * @param {string|undefined} text
 * @returns {number|null}
 */
function parsePrice(text) {
  const match = String(text ?? "").match(/\d[\d.]*(?:,\d{1,2})?/);
  if (!match) return null;
  const value = Number(match[0].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** Formata um número como moeda brasileira (ex.: "R$ 440,00"). */
const formatBRL = (value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Lê o carrinho salvo, descartando itens inválidos (peça que não existe mais, vendida ou com tamanho antigo).
 *
 * @returns {{name: string, size: string, qty: number}[]}
 */
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved
      .map((item) => ({
        name: String(item.name),
        size: String(item.size || ""),
        qty : Math.min(MAX_QTY, Math.max(1, parseInt(item.qty, 10) || 1))
      }))
      .filter((item) => {
        const product = findProduct(item.name);
        return product && !product.soldOut && (!item.size || getSizes(product).includes(item.size));
      });
  } catch (e) {
    return []; // storage bloqueado ou JSON quebrado: começa vazio
  }
}

let cart = loadCart();

/**
 * Salva o carrinho, atualiza o contador do menu e, se a view do carrinho está aberta, redesenha.
 *
 * @returns {void}
 */
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  const units = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = units;
  cartBadge.hidden = units === 0;
  if (!cartView.hidden) renderCart();
}

/**
 * Coloca uma unidade da peça no carrinho (soma na linha existente se o produto e o tamanho forem iguais).
 *
 * @param {Product} product
 * @param {string} [size] - Tamanho escolhido ("" quando a peça não tem tamanho ou ainda não foi escolhido)
 * @returns {void}
 */
function addToCart(product, size = "") {
  const line = cart.find((item) => item.name === product.name && item.size === size);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + 1);
  else cart.push({ name: product.name, size, qty: 1 });
  saveCart();
}

/**
 * Valor do frete para o subtotal atual: null (ainda não calculado), 0 (grátis) ou o preço da região.
 *
 * @param {number} subtotal
 * @returns {number|null}
 */
function getShippingCost(subtotal) {
  if (!cartShipping) return null;
  if (SHIPPING.freeAbove > 0 && subtotal >= SHIPPING.freeAbove) return 0;
  return cartShipping.price;
}

/**
 * Calcula unidades, subtotal, frete e o texto do total. Peças com preço "a informar" não entram na soma
 * e fazem o total indicar "+ itens a combinar".
 *
 * @returns {{units: number, subtotalText: string, shippingText: string, totalText: string}}
 */
function getCartTotals() {
  let units = 0, subtotal = 0, unpriced = 0;
  cart.forEach((line) => {
    const unit = parsePrice(findProduct(line.name).price);
    units += line.qty;
    if (unit === null) unpriced += line.qty;
    else subtotal += unit * line.qty;
  });

  const shipping = getShippingCost(subtotal);
  const sum = subtotal + (shipping || 0);

  let subtotalText = formatBRL(subtotal);
  if (unpriced) subtotalText = subtotal > 0 ? `${subtotalText} + a combinar` : "a combinar";

  let totalText = formatBRL(sum);
  if (unpriced) totalText = sum > 0 ? `${totalText} + itens a combinar` : "a combinar";

  const shippingText = shipping === null ? "calcule abaixo" : shipping === 0 ? "Grátis" : formatBRL(shipping);
  return { units, subtotalText, shippingText, totalText };
}

/** Aplica a máscara de CEP: "89270000" -> "89270-000". */
const maskCep = (value) => {
  const digits = String(value).replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

/**
 * Consulta o CEP no ViaCEP e calcula o frete pela tabela SHIPPING. Atualiza `cartShipping` / `cartShippingMsg`.
 *
 * @returns {Promise<void>}
 */
async function calculateShipping() {
  const digits = cartCep.replace(/\D/g, "");
  cartShipping = null;
  cartShippingMsg = "";

  if (digits.length !== 8) {
    cartShippingMsg = "Digite um CEP com 8 números.";
    refreshCartSummary();
    return;
  }

  cartShippingLoading = true;
  refreshCartSummary();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
    const data = await response.json();
    if (!response.ok || data.erro) {
      cartShippingMsg = "CEP não encontrado. Confira os números.";
    } else {
      const rate = data.uf === SHIPPING.originUF ? SHIPPING.rates.mesmoEstado : SHIPPING.rates[UF_REGION[data.uf]];
      if (!rate) {
        cartShippingMsg = "Não conseguimos calcular o frete para esse CEP. Chame a gente no WhatsApp.";
      } else if (cartCep.replace(/\D/g, "") === digits) { // ignora a resposta se o cliente já trocou o CEP
        cartShipping = {
          cep: digits,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          uf: data.uf,
          price: rate.price,
          days: rate.days
        };
      }
    }
  } catch (e) {
    cartShippingMsg = "Não foi possível consultar o CEP agora. Tente de novo em instantes.";
  } finally {
    clearTimeout(timeout);
    cartShippingLoading = false;
  }
  refreshCartSummary();
}

/** Texto abaixo do campo de CEP: erro, cidade/prazo do frete calculado ou o link para descobrir o CEP. */
function shippingResultHTML() {
  if (cartShippingMsg) return `<span class="cart-shipping-error">${escapeHTML(cartShippingMsg)}</span>`;
  if (cartShipping) {
    return `${escapeHTML(cartShipping.city)} / ${escapeHTML(cartShipping.uf)} — entrega em ${escapeHTML(cartShipping.days)}`;
  }
  return `<a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener">Não sei meu CEP</a>`;
}

/**
 * Atualiza só os pontos do resumo que mudam com o frete (valor, total, mensagem e botão),
 * sem redesenhar o carrinho — assim o campo de CEP não perde o foco enquanto o cliente digita.
 *
 * @returns {void}
 */
function refreshCartSummary() {
  const summary = cartContent.querySelector(".cart-summary");
  if (!summary) return;
  const totals = getCartTotals();
  summary.querySelector("[data-sum-subtotal]").textContent = totals.subtotalText;
  summary.querySelector("[data-sum-shipping]").textContent = totals.shippingText;
  summary.querySelector("[data-sum-total]").textContent = totals.totalText;
  summary.querySelector(".cart-shipping-result").innerHTML = shippingResultHTML();
  const button = summary.querySelector(".cart-shipping-button");
  button.disabled = cartShippingLoading;
  button.textContent = cartShippingLoading ? "..." : "CALCULAR";
}

/** Aviso temporário "adicionado ao carrinho", com atalho para abrir o carrinho (útil no celular, onde o menu fica fechado). */
function showCartToast(message) {
  let toast = document.querySelector(".cart-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${escapeHTML(message)}</span><button type="button" data-cart-action="open">VER CARRINHO</button>`;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3800);
}

/**
 * Desenha a view do carrinho: lista de itens (foto, tamanho, quantidade, preço) e o resumo do pedido.
 *
 * @returns {void}
 */
function renderCart() {
  if (cart.length === 0) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <p>Seu carrinho está vazio.</p>
        <button class="buy-now-button" type="button" data-cart-shop>VER PRODUTOS</button>
      </div>`;
    return;
  }

  const rows = cart.map((line, index) => {
    const product = findProduct(line.name);
    const unit = parsePrice(product.price);
    const photo = product.image || (product.gallery && product.gallery[0]);
    const image = photo
      ? `<img src="${photo}" alt="${escapeHTML(product.name)}">`
      : `<div class="garment garment-${product.category}" aria-hidden="true"><span class="garment-label">ALUZ</span></div>`;
    const sizes = getSizes(product);
    const sizeSelect = sizes.length ? `
        <label class="cart-size">Tamanho
          <select data-cart-size>
            <option value="">Escolher</option>
            ${sizes.map((size) => `<option value="${size}"${size === line.size ? " selected" : ""}>${size}</option>`).join("")}
          </select>
        </label>` : "";

    return `
      <article class="cart-item" data-cart-index="${index}">
        <div class="cart-item-image">${image}</div>
        <div class="cart-item-info">
          <p class="detail-category">${product.category} / ${product.color || ""}</p>
          <h2>${product.name}</h2>${sizeSelect}
          <div class="cart-item-row">
            <div class="cart-qty" role="group" aria-label="Quantidade">
              <button type="button" data-cart-qty="-1" aria-label="Diminuir quantidade">−</button>
              <span>${line.qty}</span>
              <button type="button" data-cart-qty="1" aria-label="Aumentar quantidade">+</button>
            </div>
            <strong class="cart-item-price">${unit === null ? "a combinar" : formatBRL(unit * line.qty)}</strong>
          </div>
          <button class="cart-remove" type="button" data-cart-remove>Remover</button>
        </div>
      </article>`;
  }).join("");

  const { units, subtotalText, shippingText, totalText } = getCartTotals();
  cartContent.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">${rows}</div>
      <aside class="cart-summary" aria-label="Resumo do pedido">
        <h2>Resumo</h2>
        <dl>
          <div><dt>Itens</dt><dd>${units}</dd></div>
          <div><dt>Subtotal</dt><dd data-sum-subtotal>${subtotalText}</dd></div>
          <div><dt>Frete</dt><dd data-sum-shipping>${shippingText}</dd></div>
          <div class="cart-total"><dt>Total</dt><dd data-sum-total>${totalText}</dd></div>
        </dl>
        <form class="cart-shipping" data-cart-shipping-form novalidate>
          <label for="cart-cep">Calcular frete (CEP)</label>
          <div class="cart-shipping-row">
            <input id="cart-cep" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="${escapeHTML(cartCep)}">
            <button class="cart-shipping-button" type="submit"${cartShippingLoading ? " disabled" : ""}>${cartShippingLoading ? "..." : "CALCULAR"}</button>
          </div>
          <p class="cart-shipping-result" aria-live="polite">${shippingResultHTML()}</p>
        </form>
        <p class="cart-error" role="alert" hidden></p>
        <button class="buy-now-button cart-checkout" type="button" data-cart-checkout>FINALIZAR PEDIDO</button>
        <p class="cart-note">Na próxima tela você informa seus dados e o WhatsApp abre com o pedido pronto. O pagamento combinamos por lá.</p>
        <div class="cart-secondary">
          <button class="cart-link" type="button" data-cart-shop>Continuar comprando</button>
          <button class="cart-link" type="button" data-cart-clear>Esvaziar carrinho</button>
        </div>
      </aside>
    </div>`;
}

/** Mostra uma mensagem de erro no resumo do carrinho. */
function showCartError(text) {
  const error = cartContent.querySelector(".cart-error");
  if (!error) return;
  error.textContent = text;
  error.hidden = false;
}

/**
 * "Finalizar pedido": exige o tamanho de toda peça que tem tamanhos e o frete calculado;
 * depois abre a tela com os dados do cliente (openCheckoutModal).
 *
 * @returns {void}
 */
function checkout() {
  const missing = cart.filter((line) => getSizes(findProduct(line.name)).length && !line.size);
  if (missing.length) {
    showCartError(`Escolha o tamanho de: ${[...new Set(missing.map((line) => line.name))].join(", ")}.`);
    return;
  }
  if (!cartShipping || cartShipping.cep !== cartCep.replace(/\D/g, "")) {
    showCartError("Calcule o frete com o seu CEP antes de finalizar.");
    cartContent.querySelector("#cart-cep")?.focus();
    return;
  }
  openCheckoutModal();
}

// ---------------------------- Tela de finalização (dados do cliente) ----------------------------

const maskCpf = (value) => {
  const d = String(value).replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const maskPhone = (value) => {
  const d = String(value).replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** Confere os dígitos verificadores do CPF (e recusa sequências como 111.111.111-11). */
function isValidCpf(value) {
  const d = String(value).replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let length = 9; length <= 10; length++) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(d[i]) * (length + 1 - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(d[length])) return false;
  }
  return true;
}

let checkoutModal = null;   // criado na primeira abertura
let checkoutOpener = null;  // botão que abriu a tela (o foco volta para ele ao fechar)

/** Monta um campo com rótulo flutuante (o rótulo sobe quando o campo tem texto). */
const checkoutField = (name, label, attrs = "", extraClass = "") =>
  `<div class="ck-field ${extraClass}"><input id="ck-${name}" name="${name}" placeholder=" " ${attrs}><label for="ck-${name}">${label}</label></div>`;

/** Cria a tela de dados do cliente (uma vez) e liga seus eventos. */
function buildCheckoutModal() {
  checkoutModal = document.createElement("div");
  checkoutModal.className = "checkout-modal";
  checkoutModal.hidden = true;
  checkoutModal.setAttribute("role", "dialog");
  checkoutModal.setAttribute("aria-modal", "true");
  checkoutModal.setAttribute("aria-labelledby", "checkout-title");
  checkoutModal.innerHTML = `
    <div class="checkout-backdrop" data-checkout-close></div>
    <form class="checkout-card" novalidate>
      <button class="checkout-close" type="button" aria-label="Fechar" data-checkout-close>×</button>
      <p class="eyebrow">ALUZ / FINALIZAR PEDIDO</p>
      <h2 id="checkout-title">Seus dados</h2>

      <h3 class="ck-heading">Contato</h3>
      <div class="ck-grid">
        ${checkoutField("name", "Nome", 'type="text" autocomplete="given-name"')}
        ${checkoutField("surname", "Sobrenome", 'type="text" autocomplete="family-name"')}
        ${checkoutField("cpf", "CPF", 'type="text" inputmode="numeric" autocomplete="off" maxlength="14"', "ck-full")}
        ${checkoutField("email", "E-mail", 'type="email" inputmode="email" autocomplete="email"', "ck-full")}
        ${checkoutField("phone", "Telefone (WhatsApp)", 'type="tel" inputmode="tel" autocomplete="tel-national" maxlength="15"', "ck-full")}
      </div>

      <h3 class="ck-heading">Entrega</h3>
      <div class="ck-grid">
        ${checkoutField("cep", "CEP", 'type="text" readonly tabindex="-1"', "ck-full ck-locked")}
        ${checkoutField("street", "Endereço", 'type="text" autocomplete="address-line1"', "ck-wide")}
        ${checkoutField("number", "Número", 'type="text" autocomplete="off" maxlength="10"')}
        ${checkoutField("complement", "Apartamento, bloco etc. (opcional)", 'type="text" autocomplete="address-line2"')}
        ${checkoutField("neighborhood", "Bairro", 'type="text" autocomplete="address-level3"')}
        ${checkoutField("city", "Cidade", 'type="text" readonly tabindex="-1"', "ck-locked")}
        ${checkoutField("state", "Estado", 'type="text" readonly tabindex="-1"', "ck-locked")}
      </div>
      <p class="ck-note">CEP, cidade e estado vêm do cálculo do frete. Para trocar, volte ao carrinho e calcule de novo.</p>

      <dl class="checkout-total"><div><dt>Total com frete</dt><dd data-checkout-total></dd></div></dl>
      <p class="checkout-error" role="alert" hidden></p>
      <button class="buy-now-button checkout-submit" type="submit">ENVIAR PEDIDO NO WHATSAPP</button>
      <p class="cart-note">Seus dados vão só para o WhatsApp da loja e não ficam salvos neste site.</p>
    </form>`;
  document.body.appendChild(checkoutModal);

  const form = checkoutModal.querySelector("form");

  // Máscaras e memória dos campos (se fechar sem querer, o que foi digitado continua lá)
  form.addEventListener("input", (event) => {
    const field = event.target;
    if (field.readOnly) return;
    if (field.name === "cpf") field.value = maskCpf(field.value);
    if (field.name === "phone") field.value = maskPhone(field.value);
    if (field.name in checkoutData) checkoutData[field.name] = field.value;
    form.querySelector(".checkout-error").hidden = true;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitCheckout(form);
  });

  checkoutModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-checkout-close]")) closeCheckoutModal();
  });

  // Escape fecha; Tab fica preso dentro da tela enquanto ela está aberta
  document.addEventListener("keydown", (event) => {
    if (checkoutModal.hidden) return;
    if (event.key === "Escape") {
      closeCheckoutModal();
    } else if (event.key === "Tab") {
      const focusable = [...checkoutModal.querySelectorAll("button, input")].filter((el) => !el.disabled && el.tabIndex >= 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
}

/** Abre a tela de dados, já com CEP, rua, bairro, cidade e estado vindos do cálculo do frete. */
function openCheckoutModal() {
  if (!checkoutModal) buildCheckoutModal();
  const form = checkoutModal.querySelector("form");

  // Se o CEP mudou desde a última vez, as sugestões de rua e bairro são refeitas (o número e o complemento são do cliente)
  if (checkoutData.cep !== cartShipping.cep) {
    checkoutData.cep = cartShipping.cep;
    checkoutData.street = cartShipping.street;
    checkoutData.neighborhood = cartShipping.neighborhood;
    checkoutData.number = "";
    checkoutData.complement = "";
  }

  Object.keys(checkoutData).forEach((key) => {
    if (key !== "cep") form.elements[key].value = checkoutData[key];
  });
  form.elements.cep.value = maskCep(cartShipping.cep);
  form.elements.city.value = cartShipping.city;
  form.elements.state.value = UF_NAMES[cartShipping.uf] || cartShipping.uf;
  checkoutModal.querySelector("[data-checkout-total]").textContent = getCartTotals().totalText;
  form.querySelector(".checkout-error").hidden = true;

  checkoutOpener = document.activeElement;
  checkoutModal.hidden = false;
  document.body.style.overflow = "hidden";
  form.elements.name.focus();
}

function closeCheckoutModal() {
  if (!checkoutModal || checkoutModal.hidden) return;
  checkoutModal.hidden = true;
  document.body.style.overflow = "";
  if (checkoutOpener && document.contains(checkoutOpener)) checkoutOpener.focus();
}

/**
 * Valida os dados e abre o WhatsApp com o pedido completo (itens, frete, total e dados de entrega).
 *
 * @param {HTMLFormElement} form
 * @returns {void}
 */
function submitCheckout(form) {
  const clean = (text) => String(text).trim().replace(/\s+/g, " ");
  const name = clean(checkoutData.name);
  const surname = clean(checkoutData.surname);
  const email = clean(checkoutData.email);
  const street = clean(checkoutData.street);
  const number = clean(checkoutData.number);
  const complement = clean(checkoutData.complement);
  const neighborhood = clean(checkoutData.neighborhood);
  const phoneDigits = checkoutData.phone.replace(/\D/g, "");

  let problem = "", field = null;
  if (!name) { problem = "Digite o seu nome."; field = "name"; }
  else if (!surname) { problem = "Digite o seu sobrenome."; field = "surname"; }
  else if (!isValidCpf(checkoutData.cpf)) { problem = "CPF inválido. Confira os números."; field = "cpf"; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { problem = "E-mail inválido. Confira o endereço."; field = "email"; }
  else if (phoneDigits.length < 10 || Number(phoneDigits.slice(0, 2)) < 11) { problem = "Telefone inválido. Informe o DDD e o número."; field = "phone"; }
  else if (street.length < 3) { problem = "Digite o endereço (rua ou avenida)."; field = "street"; }
  else if (!/\d|^s\/?n$|sem n[úu]mero/i.test(number)) { problem = "Digite o número da casa ou do prédio (ou s/n)."; field = "number"; }
  else if (neighborhood.length < 2) { problem = "Digite o bairro."; field = "neighborhood"; }

  if (problem) {
    const error = form.querySelector(".checkout-error");
    error.textContent = problem;
    error.hidden = false;
    form.elements[field].focus();
    return;
  }

  const lines = cart.map((line) => {
    const unit = parsePrice(findProduct(line.name).price);
    return `• ${line.qty}x ${line.name}${line.size ? ` — Tam. ${line.size}` : ""} — ${unit === null ? "preço a combinar" : formatBRL(unit * line.qty)}`;
  });
  const totals = getCartTotals();
  const cep = maskCep(cartShipping.cep);
  const address = `${street}, ${number}${complement ? `, ${complement}` : ""} — ${neighborhood} — ${cartShipping.city}/${cartShipping.uf} — CEP ${cep}`;
  const message = [
    "Olá! Quero finalizar meu pedido na ALUZ:",
    "",
    ...lines,
    "",
    `Subtotal: ${totals.subtotalText}`,
    `Frete (CEP ${cep} — ${cartShipping.city}/${cartShipping.uf}): ${totals.shippingText} — prazo ${cartShipping.days}`,
    `Total: ${totals.totalText}`,
    "",
    "DADOS PARA ENTREGA",
    `Nome: ${name} ${surname}`,
    `CPF: ${maskCpf(checkoutData.cpf)}`,
    `E-mail: ${email}`,
    `Telefone: ${maskPhone(checkoutData.phone)}`,
    `Endereço: ${address}`
  ].join("\n");

  window.open(getOrderLink(message), "_blank", "noopener");
  closeCheckoutModal();
}

// Botões "Colocar no carrinho" / "Comprar já" (nos cards, no detalhe e nas medidas), escolha de tamanho e atalho do aviso.
// Um único listener no document, porque esses botões são recriados via innerHTML a cada renderização.
document.addEventListener("click", (event) => {
  const chip = event.target.closest(".size-chip");
  if (chip) {
    const picker = chip.closest(".size-picker");
    picker.querySelectorAll(".size-chip").forEach((other) => {
      other.classList.toggle("active", other === chip);
      other.setAttribute("aria-pressed", String(other === chip));
    });
    picker.querySelector(".size-hint").hidden = true;
    return;
  }

  const trigger = event.target.closest("[data-cart-action]");
  if (!trigger) return;
  const action = trigger.dataset.cartAction;

  if (action === "open") {
    showView("carrinho");
    closeMenu();
    return;
  }

  const product = products[Number(trigger.dataset.productIndex)];
  if (!product || product.soldOut) return;

  // Com seletor de tamanho na tela (detalhe/medidas), o tamanho é obrigatório; nos cards ele é escolhido no carrinho
  const picker = trigger.closest(".detail-info")?.querySelector(".size-picker");
  const size = picker?.querySelector(".size-chip.active")?.dataset.size || "";
  if (picker && !size) {
    picker.querySelector(".size-hint").hidden = false;
    return;
  }

  addToCart(product, size);
  if (action === "buy") {
    showView("carrinho"); // "Comprar já": vai direto para o pedido
    closeMenu();
  } else {
    showCartToast(`${product.name}${size ? ` (${size})` : ""} no carrinho`);
  }
});

// Ações dentro do carrinho: quantidade, remover, esvaziar, continuar comprando e finalizar
cartContent.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const row = button.closest("[data-cart-index]");
  const line = row ? cart[Number(row.dataset.cartIndex)] : null;

  if (button.dataset.cartQty && line) {
    line.qty = Math.min(MAX_QTY, Math.max(1, line.qty + Number(button.dataset.cartQty)));
    saveCart();
  } else if (button.hasAttribute("data-cart-remove") && line) {
    cart.splice(cart.indexOf(line), 1);
    saveCart();
  } else if (button.hasAttribute("data-cart-clear")) {
    cart = [];
    saveCart();
  } else if (button.hasAttribute("data-cart-shop")) {
    showView("pronto-entrega");
  } else if (button.hasAttribute("data-cart-checkout")) {
    checkout();
  }
});

// Troca de tamanho de um item; se já existir a mesma peça nesse tamanho, as duas linhas viram uma só
cartContent.addEventListener("change", (event) => {
  const select = event.target.closest("select[data-cart-size]");
  if (!select) return;
  const line = cart[Number(select.closest("[data-cart-index]").dataset.cartIndex)];
  line.size = select.value;
  const twin = cart.find((item) => item !== line && item.name === line.name && item.size === line.size);
  if (twin) {
    twin.qty = Math.min(MAX_QTY, twin.qty + line.qty);
    cart.splice(cart.indexOf(line), 1);
  }
  saveCart();
});

// CEP: aplica a máscara e guarda o valor (sem redesenhar, para não perder o foco ao digitar).
// Se o CEP muda depois de calculado, o frete antigo deixa de valer.
cartContent.addEventListener("input", (event) => {
  if (event.target.id !== "cart-cep") return;
  event.target.value = maskCep(event.target.value);
  cartCep = event.target.value;
  cartShippingMsg = "";
  if (cartShipping && cartShipping.cep !== cartCep.replace(/\D/g, "")) cartShipping = null;
  refreshCartSummary();
});

// Enter no campo de CEP (ou toque em CALCULAR) calcula o frete
cartContent.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-cart-shipping-form]")) return;
  event.preventDefault();
  calculateShipping();
});

saveCart(); // desenha o contador do menu com o carrinho salvo

// ================================= STEP 9: Eventos e estado inicial =================================

// Cada botão da barra lateral abre a view indicada no seu `data-view`
sideSectionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showView(button.dataset.view);
    closeMenu(); // no celular, fecha o menu depois de escolher a seção
  });
});

// Clicar na logo leva de volta para a view inicial ("Quem Somos")
brandButton.addEventListener("click", () => {
  showView("quem-somos");
  closeMenu();
});

// Busca: filtra os produtos enquanto o visitante digita.
// - Com texto: garante que o catálogo esteja aberto (fechando qualquer detalhe) e redesenha a lista.
// - Sem texto (campo apagado): se já está no catálogo, volta a mostrar todas as peças;
//   em outra view, não faz nada (não tira o visitante de onde ele está).
searchInput.addEventListener("input", () => {
  const hasTerm = normalizeText(searchInput.value) !== "";

  if (hasTerm) {
    showView("pronto-entrega"); // abre o catálogo, fecha o detalhe e já chama renderProducts()
  } else if (!catalogView.hidden) {
    closeProductDetail();
    renderProducts();
  }
});

// Estado inicial ao carregar a página: começa na view "Quem Somos"
showView("quem-somos");

// ================================= STEP 10: Menu hambúrguer (mobile) =================================
// Em telas até 900px a barra lateral vira uma barra no topo e o menu (busca + seções) fica escondido
// até o visitante tocar no botão hambúrguer. No desktop o botão não aparece e nada disso tem efeito visual.

// Mesma largura do breakpoint mobile em styles.css (se mudar lá, mude aqui)
const MOBILE_MENU_QUERY = window.matchMedia("(max-width: 900px)");

/**
 * Abre ou fecha o menu mobile.
 *
 * @param {boolean} open - true para abrir, false para fechar
 * @returns {void}
 *
 * Side Effects:
 *  - Alterna a classe `menu-open` na barra lateral (o CSS mostra/esconde o painel e anima o ícone)
 *  - Atualiza aria-expanded e aria-label do botão, para leitores de tela
 */
function setMenuOpen(open) {
  sidebar.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

/** Atalho para fechar o menu (seguro de chamar mesmo quando ele já está fechado). */
function closeMenu() {
  setMenuOpen(false);
}

// Botão hambúrguer: alterna entre aberto e fechado
menuToggle.addEventListener("click", () => {
  setMenuOpen(!sidebar.classList.contains("menu-open"));
});

// Tocar em qualquer lugar fora da barra do topo fecha o menu
document.addEventListener("click", (event) => {
  if (!sidebar.contains(event.target)) closeMenu();
});

// Esc fecha o menu e devolve o foco ao botão
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("menu-open")) {
    closeMenu();
    menuToggle.focus();
  }
});

// Enter na busca: fecha o menu para mostrar os resultados (e, no celular, recolhe o teclado)
searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  closeMenu();
  if (MOBILE_MENU_QUERY.matches) searchInput.blur();
});

// Se a tela for alargada (ex.: girar o aparelho) com o menu aberto, volta ao estado fechado
MOBILE_MENU_QUERY.addEventListener("change", (event) => {
  if (!event.matches) closeMenu();
});

// ================================= STEP 11: Intro animada =================================
/* ===== Intro ===== */
// Elemento da intro (#intro). Ele pode já ter sido removido pelo script inline do index.html
// quando o visitante já viu a intro nesta sessão — nesse caso `intro` é null e o bloco abaixo não roda.
const intro = document.querySelector("#intro");

if (intro) {
  const INTRO_MS = 4300; // quanto tempo a intro fica na tela antes de abrir o site

  /**
   * Encerra a intro: dispara a animação de saída e remove o elemento do DOM.
   *
   * É segura para ser chamada várias vezes (timer, clique e tecla): se a classe "sai"
   * já foi aplicada, retorna imediatamente. Grava em `sessionStorage` que a intro foi vista,
   * para não repeti-la até o visitante fechar a aba.
   *
   * @returns {void}
   *
   * Side Effects:
   *  - Adiciona a classe `sai` (fade-out via CSS)
   *  - Grava a chave "aluzIntro" no sessionStorage
   *  - Remove `#intro` do DOM após 1 segundo (tempo da transição de saída)
   */
  function endIntro() {
    if (intro.classList.contains("sai")) return; // Já está saindo: evita executar duas vezes
    intro.classList.add("sai");
    try { sessionStorage.setItem("aluzIntro", "1"); } catch (e) {} // try/catch: o storage pode estar bloqueado (ex.: modo privado)
    setTimeout(() => intro.remove(), 1000);
  }

  // A intro termina sozinha após INTRO_MS...
  setTimeout(endIntro, INTRO_MS);
  // ...ou antes, se o visitante clicar na tela ou apertar qualquer tecla (a tecla é ouvida apenas uma vez)
  intro.addEventListener("click", endIntro);
  document.addEventListener("keydown", endIntro, { once: true });
}