/**
 * ALUZ — Lógica da vitrine (script.js)
 *
 * Este módulo controla toda a interatividade do site da ALUZ (streetwear underground):
 * a navegação entre as seções da barra lateral, a listagem e a busca de produtos,
 * a página de detalhe de cada peça (com galeria de fotos e tabela de medidas),
 * o link de compra via WhatsApp e a animação de introdução (intro) exibida ao abrir o site.
 *
 * Os dados dos produtos ficam em um array local (`products`), e o HTML de cada tela
 * é gerado dinamicamente via template strings e injetado no DOM definido em `index.html`.
 *
 * Main functionality:
 *  - Referenciar os elementos do DOM usados pelo site (busca, grid, detalhe, views, botões)
 *  - Manter o catálogo de produtos e resolver o caminho das imagens (pasta `fotos/`)
 *  - Alternar entre as três views: "Quem Somos", "Produtos" e "Ensaio de Fotos"
 *  - Renderizar a lista de produtos com filtro por texto digitado na busca
 *  - Abrir o detalhe do produto (galeria com miniaturas) e a tela de medidas
 *  - Gerar o link de compra pelo WhatsApp com mensagem pré-preenchida
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
const sideSectionButtons = document.querySelectorAll(".side-section-button"); // Botões de navegação da barra lateral (um por view)
const brandButton        = document.querySelector(".brand");                // Logo da marca (clicar leva de volta ao "Quem Somos")
const sidebar            = document.querySelector(".sidebar");              // Barra lateral (no celular vira a barra do topo; recebe a classe "menu-open")
const menuToggle         = document.querySelector(".menu-toggle");          // Botão hambúrguer (visível só em telas até 900px)

// Número de WhatsApp da loja, no formato internacional (55 = Brasil, 47 = DDD) e sem símbolos.
// É usado para montar o link wa.me de compra em getWhatsAppLink().
const WHATSAPP_NUMBER = "5547997709664";

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
 * Exibe uma das três views do site e destaca o botão correspondente na barra lateral.
 *
 * Usa o atributo `hidden` para mostrar apenas a view pedida. Ao entrar em "pronto-entrega"
 * (a view de Produtos), fecha qualquer detalhe aberto e redesenha a lista, de modo que
 * o usuário sempre veja o catálogo "limpo" ao voltar para a seção.
 *
 * Args:
 * @param {"quem-somos"|"pronto-entrega"|"ensaio-fotos"} viewName - Identificador da view (valor do `data-view` dos botões)
 *
 * @returns {void}
 *
 * Side Effects:
 *  - Altera `hidden` das três views
 *  - Alterna a classe `active` nos botões da barra lateral
 *  - Pode chamar closeProductDetail() e renderProducts() (que alteram o DOM)
 */
function showView(viewName) {
  // Cada view fica oculta, exceto a que corresponde ao nome recebido
  aboutView.hidden = viewName !== "quem-somos";
  catalogView.hidden = viewName !== "pronto-entrega";
  photoshootView.hidden = viewName !== "ensaio-fotos";

  // Marca como ativo apenas o botão da barra lateral cuja view está aberta
  sideSectionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  // Ao abrir o catálogo: garante que nenhum detalhe esteja aberto e redesenha a lista
  if (viewName === "pronto-entrega") {
    closeProductDetail();
    renderProducts();
  }
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
 * Monta o link de compra pelo WhatsApp para um produto.
 *
 * O link usa o formato `wa.me/<numero>?text=<mensagem>`; a mensagem vem pré-preenchida
 * com o nome da peça, e é codificada com encodeURIComponent para preservar acentos,
 * aspas e espaços na URL.
 *
 * @param {Product} product - Produto de interesse (usa apenas `product.name`)
 * @returns {string} URL completa que abre a conversa no WhatsApp
 *
 * Example:
 *   getWhatsAppLink({ name: "Boné Jeans" })
 *   // "https://wa.me/5547997709664?text=Ol%C3%A1!%20Tenho%20interesse%20em%20Bon%C3%A9%20Jeans."
 */
function getWhatsAppLink(product) {
  const message = `Olá! Tenho interesse em ${product.name}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

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
 * Botão de compra de um produto.
 * Disponível -> link do WhatsApp. Vendido -> botão desativado (sem link), para ninguém iniciar uma compra impossível.
 *
 * @param {Product} product
 * @returns {string} HTML do botão
 */
function getBuyButtonHTML(product) {
  if (product.soldOut) {
    return '<span class="whatsapp-button is-sold-out" aria-disabled="true">PEÇA VENDIDA</span>';
  }
  return `<a class="whatsapp-button" href="${getWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer">COMPRAR PELO WHATSAPP</a>`;
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
 * tem `measureImage`), botão de compra pelo WhatsApp e rodapé com cor e preço.
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
 * (foto, categoria/cor, nome, descrição, botões "VER PRODUTO" e "COMPRAR PELO WHATSAPP", rodapé)
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