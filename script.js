const searchInput = document.querySelector("#search");
const productGrid = document.querySelector("#product-grid");
const productCount = document.querySelector("#product-count");
const productDetail = document.querySelector("#product-detail");
const aboutView = document.querySelector("#about-view");
const catalogView = document.querySelector("#catalog-view");
const photoshootView = document.querySelector("#photoshoot-view");
const sideSectionButtons = document.querySelectorAll(".side-section-button");
const brandButton = document.querySelector(".brand");
const WHATSAPP_NUMBER = "5547997709664";

const products = [
  {
    name: "Camisa polo “EQU1L1BR1UM” V2",
    category: "camiseta",
    color: "Preto / Branco",
    price: "R$ 220,00",
    image: "camiseta ying yang.png",
    gallery: ["camiseta ying yang.png", "ensaio ft 1.png", "ensaio ft 3.png"],
    measureImage: "polo_vermelha.png",
    description: "Camisa polo “EQU1L1BR1UM” V2\nConferir Tamanhos Disponíveis\nPREÇO R$220,00",
    measureDescription: "Camisa feita de malha ponto de Roma com 92% viscose e 7% elastano para um melhor caimento e conforto durante o uso. Patchwork desfiados com estampas em silk-screen na parte frontal e nas costas. Contendo também em toda a camisa costuras duplas para maior resistência e durabilidade. Podendo ocorrer pequenas variações de uma peça para outra."
  },
  {
    name: "Boné Jeans",
    category: "acessório",
    price: "VENDIDO",
    color: "Jeans",
    image: "bone jeans.png",
    gallery: ["bone jeans.png", "ensaio ft 2.png"],
    description: "CADET-CAP UPCYCLING 1/1\nTAM: regulável\nVENDIDO ❌❌❌"
  },
  { name: "Camiseta Eclipse", category: "camiseta", price: "R$ 209", color: "Cinza", image: "" }
];

function showView(viewName) {
  aboutView.hidden = viewName !== "quem-somos";
  catalogView.hidden = viewName !== "pronto-entrega";
  photoshootView.hidden = viewName !== "ensaio-fotos";

  sideSectionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (viewName === "pronto-entrega") {
    closeProductDetail();
    renderProducts();
  }
}

function closeProductDetail() {
  productDetail.hidden = true;
  productDetail.classList.remove("visible");
  productGrid.hidden = false;
  catalogView.classList.remove("measure-view");
  catalogView.querySelector(".measure-heading")?.remove();
  catalogView.querySelector(".catalog-heading").hidden = false;
}

function getWhatsAppLink(product) {
  const message = `Olá! Tenho interesse em ${product.name}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function openProductDetail(product) {
  catalogView.classList.remove("measure-view");
  catalogView.querySelector(".measure-heading")?.remove();
  catalogView.querySelector(".catalog-heading").hidden = true;
  const gallery = product.gallery || (product.image ? [product.image] : []);
  const image = gallery.length
    ? `<img src="${gallery[0]}" alt="${product.name}">`
    : `<div class="garment garment-${product.category}" aria-hidden="true">
         <span class="garment-label">ALUZ</span>
       </div>`;
  productDetail.innerHTML = `
    <div class="detail-gallery">
      <div class="detail-image">${image}</div>
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
      ${product.measureImage ? '<button class="measure-button detail-measure-button" type="button">VER MEDIDAS</button>' : ""}
      <a class="whatsapp-button" href="${getWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer">COMPRAR PELO WHATSAPP</a>
      <div class="detail-meta">
        <span>${product.color || ""}</span>
        <span>${product.price}</span>
      </div>
    </div>
  `;

  productDetail.hidden = false;
  productDetail.classList.add("visible");
  productGrid.hidden = true;

  productDetail.querySelector(".detail-back").addEventListener("click", closeProductDetail);
  productDetail.querySelector(".detail-measure-button")?.addEventListener("click", () => openMeasures(product));

  productDetail.querySelectorAll(".detail-thumbnail").forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      const photo = gallery[Number(thumbnail.dataset.photoIndex)];
      const mainImage = productDetail.querySelector(".detail-image img");
      if (!photo || !mainImage) return;
      mainImage.src = photo;
      productDetail.querySelectorAll(".detail-thumbnail").forEach((button) => {
        const isActive = button === thumbnail;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
    });
  });
}

function openMeasures(product) {
  if (!product.measureImage) return;

  catalogView.classList.add("measure-view");
  catalogView.querySelector(".measure-heading")?.remove();
  const measureHeading = document.createElement("div");
  measureHeading.className = "measure-heading";
  measureHeading.innerHTML = `<h1>${product.name}</h1>`;
  catalogView.insertBefore(measureHeading, productDetail);

  productDetail.innerHTML = `
    <div class="detail-image"><img src="${product.measureImage}" alt="Tabela de referência de medidas para ${product.name}"></div>
    <div class="detail-info">
      <button class="detail-back" type="button">‹ Voltar ao produto</button>
      <div class="detail-copy">
        <p class="product-description">${product.measureDescription || ""}</p>
      </div>
      <div class="measure-table" aria-label="Tabela de medidas">
        <div><span>P</span><strong>LARGURA 52 cm</strong><strong>ALTURA 68 cm</strong></div>
        <div><span>M</span><strong>LARGURA 56 cm</strong><strong>ALTURA 72 cm</strong></div>
        <div><span>G</span><strong>LARGURA 60 cm</strong><strong>ALTURA 76 cm</strong></div>
        <div><span>GG</span><strong>LARGURA 64 cm</strong><strong>ALTURA 80 cm</strong></div>
      </div>
      <a class="whatsapp-button" href="${getWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer">COMPRAR PELO WHATSAPP</a>
      <div class="detail-meta">
        <span>${product.color || ""}</span>
        <span>${product.price}</span>
      </div>
    </div>
  `;
  productDetail.hidden = false;
  productDetail.classList.add("visible");
  productGrid.hidden = true;
  productDetail.querySelector(".detail-back").addEventListener("click", () => openProductDetail(product));
}

function renderProducts() {
  const term = searchInput.value.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const matchesSearch = term === "" ||
      `${product.name} ${product.category} ${product.color}`.toLowerCase().includes(term);
    return matchesSearch;
  });

  productCount.textContent = visibleProducts.length;
  productGrid.innerHTML = visibleProducts.map((product) => {
    const image = product.image
      ? `<img src="${product.image}" alt="${product.name}">`
      : `<div class="garment garment-${product.category}" aria-hidden="true">
           <span class="garment-label">ALUZ</span>
         </div>`;

    return `
      <article class="product-listing">
        <div class="listing-image">${image}</div>
        <div class="listing-info">
          <p class="detail-category">${product.category} / ${product.color}</p>
          <h2>${product.name}</h2>
          <p class="product-description">${product.description || ""}</p>
          <div class="listing-actions">
            <button class="product-open-button" type="button">VER PRODUTO</button>
            <a class="whatsapp-button" href="${getWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer">COMPRAR PELO WHATSAPP</a>
          </div>
          <div class="detail-meta">
            <span>${product.color}</span>
            <span>${product.price}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  if (visibleProducts.length === 0) {
    productGrid.innerHTML = '<p class="empty-state">Nenhuma peça encontrada.</p>';
  }

  productGrid.querySelectorAll(".product-listing").forEach((card, index) => {
    const product = visibleProducts[index];
    const openButton = card.querySelector(".product-open-button");
    const listingImage = card.querySelector(".listing-image");

    openButton?.addEventListener("click", () => openProductDetail(product));

    listingImage.style.cursor = "pointer";
    listingImage.addEventListener("click", () => openProductDetail(product));
  });
}

sideSectionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showView(button.dataset.view);
  });
});

brandButton.addEventListener("click", () => showView("quem-somos"));

showView("quem-somos");

/* ===== Intro ===== */
const intro = document.querySelector("#intro");

if (intro) {
  const INTRO_MS = 4300; // quanto tempo a intro fica na tela antes de abrir o site

  function endIntro() {
    if (intro.classList.contains("sai")) return;
    intro.classList.add("sai");
    try { sessionStorage.setItem("aluzIntro", "1"); } catch (e) {}
    setTimeout(() => intro.remove(), 1000);
  }

  setTimeout(endIntro, INTRO_MS);
  intro.addEventListener("click", endIntro);
  document.addEventListener("keydown", endIntro, { once: true });
}