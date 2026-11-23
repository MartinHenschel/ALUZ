const searchInput = document.querySelector("#search");
const productGrid = document.querySelector("#product-grid");
const productCount = document.querySelector("#product-count");
const productDetail = document.querySelector("#product-detail");
const aboutView = document.querySelector("#about-view");
const catalogView = document.querySelector("#catalog-view");
const photoshootView = document.querySelector("#photoshoot-view");
const sideSectionButtons = document.querySelectorAll(".side-section-button");
const brandButton = document.querySelector(".brand");

const products = [
  {
    name: "Camiseta Ying Yang",
    category: "camiseta",
    price: "R$ 130,00",
    color: "Preto / Cinza",
    image: "camiseta ying yang.png",
    description: "CAMISETAS YING YANG\nDISPONÍVEL EM TODOS OS TAMANHOS\nPREÇO R$130,00"
  },
  {
    name: "Boné Jeans",
    category: "acessório",
    price: "VENDIDO",
    color: "Jeans",
    image: "bone jeans.png",
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
}

function openProductDetail(product) {
  const image = product.image
    ? `<img src="${product.image}" alt="${product.name}">`
    : `<div class="garment garment-${product.category}" aria-hidden="true">
         <span class="garment-label">ALUZ</span>
       </div>`;

  productDetail.innerHTML = `
    <div class="detail-image">${image}</div>
    <div class="detail-info">
      <button class="detail-back" type="button">‹ Todas as peças</button>
      <p class="detail-category">${product.category} / ${product.color}</p>
      <h2>${product.name}</h2>
      <p class="product-description">${product.description || ""}</p>
      <div class="detail-meta">
        <span>${product.color}</span>
        <span>${product.price}</span>
      </div>
    </div>
  `;

  productDetail.hidden = false;
  productDetail.classList.add("visible");
  productGrid.hidden = true;
  productDetail.querySelector(".detail-back").addEventListener("click", closeProductDetail);
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

}

sideSectionButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showView(button.dataset.view);
  });
});

brandButton.addEventListener("click", () => showView("quem-somos"));

searchInput.addEventListener("input", () => {
  const term = searchInput.value.trim().toLowerCase();
  closeProductDetail();
  renderProducts();
});

showView("quem-somos");
