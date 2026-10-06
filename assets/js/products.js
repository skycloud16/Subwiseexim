/**
 * WISE EXIM - Centralized Dynamic Product Engine
 * Data-driven architecture reading from /data/products.json
 * Prepared for future API/Database integration while maintaining frontend-only operation.
 */

// Global product state
let ALL_PRODUCTS = [];
let ACTIVE_CATEGORY = 'all';

/**
 * 1. Data Fetcher (Future API compatible)
 */
async function fetchProducts() {
  try {
    const response = await fetch('data/products.json?v=' + Date.now());
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading products.json:', error);
    return null;
  }
}

/**
 * 2. Data Filters & Sorters
 */
function getActiveProducts(products) {
  if (!Array.isArray(products)) return [];
  // Filter status === true and sort by sort_order ascending
  return products
    .filter(p => p && p.status === true)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function filterProductsByCategory(products, category) {
  if (!category || category === 'all') return products;
  
  // Normalize category comparison
  const normCat = category.toLowerCase().replace(/[-_]/g, ' ').trim();
  
  return products.filter(p => {
    if (!p.category) return false;
    const itemCat = p.category.toLowerCase().trim();
    if (normCat === 'motors') return itemCat.includes('motor') && !itemCat.includes('part');
    if (normCat === 'parts') return itemCat.includes('part');
    if (normCat === 'components') return itemCat.includes('component');
    return itemCat === normCat;
  });
}

/**
 * 3. Card Template Generator
 */
function renderProductCard(product) {
  const imageSrc = product.image || 'assets/images/submersible-motor.png';
  const name = product.name || 'Wise Exim Product';
  const shortDesc = product.short_description || product.description || '';
  const specsNote = (product.specifications && product.specifications.length > 0)
    ? product.specifications[0].value
    : 'Product specifications will be updated based on the final product catalogue.';
  
  const hasBrochure = product.brochure && product.brochure.trim() !== '';
  const brochureBtnMarkup = hasBrochure
    ? `<a href="${product.brochure}" download="${product.slug || 'product'}-brochure.pdf" class="btn-download-brochure" aria-label="Download ${name} brochure">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
         <span>Download Brochure</span>
       </a>`
    : `<button class="btn-download-brochure disabled" aria-label="Brochure coming soon for ${name}" onclick="showFloatingNotification('Brochure is currently unavailable. Please contact us for product information.', 'error')">
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
         <span>Brochure Coming Soon</span>
       </button>`;

  return `
    <div class="product-card" data-id="${product.id}" data-category="${product.category}">
      <div class="product-card-image" onclick="openProductDetailModal(${product.id})" style="cursor: pointer;">
        <img src="${imageSrc}" alt="${name}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/submersible-motor.png';">
      </div>
      <div class="product-card-body">
        <h3 class="product-card-title" onclick="openProductDetailModal(${product.id})" style="cursor: pointer;">${name}</h3>
        <p class="product-card-desc">${shortDesc}</p>
        <div class="product-card-specs-note">${specsNote}</div>
        <div class="product-card-actions">
          <button class="btn btn-gold btn-sm open-quote-modal" data-product="${name}">Request Quote</button>
          <button class="btn btn-outline-navy btn-sm" onclick="openProductDetailModal(${product.id})">Product Information</button>
          ${brochureBtnMarkup}
        </div>
      </div>
    </div>
  `;
}

/**
 * 4. Main Products Page & Home Page Renderer
 */
async function initDynamicProductsPage() {
  const container = document.getElementById('dynamicProductsContainer');
  const homeContainer = document.getElementById('homeProductsContainer');

  if (!container && !homeContainer) return; // Neither page requires dynamic products

  if (container) {
    container.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">Loading products catalogue...</div>';
  }

  const rawProducts = await fetchProducts();

  if (rawProducts === null) {
    const errorMarkup = `
      <div class="text-center" style="grid-column: 1/-1; padding: 50px 20px; background: #FEE2E2; border: 1px solid #FCA5A5; border-radius: 8px; color: #991B1B;">
        <h4 style="font-size: 1.2rem; margin-bottom: 8px;">Unable to load products. Please try again later.</h4>
        <p style="font-size: 0.95rem;">If the issue persists, please contact our support desk.</p>
      </div>
    `;
    if (container) container.innerHTML = errorMarkup;
    if (homeContainer) homeContainer.innerHTML = errorMarkup;
    return;
  }

  ALL_PRODUCTS = getActiveProducts(rawProducts);

  if (ALL_PRODUCTS.length === 0) {
    const emptyMarkup = '<div class="text-center" style="grid-column: 1/-1; padding: 40px; color: var(--color-text-muted);">No active products available at the moment.</div>';
    if (container) container.innerHTML = emptyMarkup;
    if (homeContainer) homeContainer.innerHTML = emptyMarkup;
    return;
  }

  if (container) {
    renderDynamicProductsList();
    initCategoryFilterEvents();
  }

  if (homeContainer) {
    // Render top 3 active products on homepage
    const homeProducts = ALL_PRODUCTS.slice(0, 3);
    homeContainer.innerHTML = homeProducts.map(product => renderProductCard(product)).join('');
  }
}

function renderDynamicProductsList() {
  const container = document.getElementById('dynamicProductsContainer');
  if (!container) return;

  const filtered = filterProductsByCategory(ALL_PRODUCTS, ACTIVE_CATEGORY);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 50px; color: var(--color-text-muted);">No products found in this category.</div>';
    return;
  }

  container.innerHTML = filtered.map(product => renderProductCard(product)).join('');
}

/**
 * 5. Category Filter Event Listener
 */
function initCategoryFilterEvents() {
  const filterBtns = document.querySelectorAll('.product-filter-btn');
  if (filterBtns.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'btn-gold');
        b.classList.add('btn-outline-navy');
      });
      
      btn.classList.add('active', 'btn-gold');
      btn.classList.remove('btn-outline-navy');

      ACTIVE_CATEGORY = btn.dataset.filter || 'all';
      renderDynamicProductsList();
    });
  });
}

/**
 * 6. Product Details Modal Handler
 */
function openProductDetailModal(productId) {
  const product = ALL_PRODUCTS.find(p => p.id === productId || p.slug === productId);
  if (!product) return;

  let modal = document.getElementById('productDetailModal');
  if (!modal) {
    modal = createProductDetailModalDOM();
  }

  const nameEl = modal.querySelector('#detailProductName');
  const catEl = modal.querySelector('#detailProductCategory');
  const descEl = modal.querySelector('#detailProductDesc');
  const imageEl = modal.querySelector('#detailProductImage');
  const specsEl = modal.querySelector('#detailProductSpecs');
  const quoteBtn = modal.querySelector('#detailQuoteBtn');
  const brochureContainer = modal.querySelector('#detailBrochureContainer');

  if (nameEl) nameEl.textContent = product.name;
  if (catEl) catEl.textContent = product.category || 'Submersible Component';
  if (descEl) descEl.textContent = product.description || product.short_description || '';
  if (imageEl) {
    imageEl.src = product.image || 'assets/images/submersible-motor.png';
    imageEl.alt = product.name;
  }

  // Render Specifications
  if (specsEl) {
    if (product.specifications && product.specifications.length > 0) {
      specsEl.innerHTML = product.specifications.map(s => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--color-border); font-size: 0.9rem;">
          <span style="font-weight: 600; color: var(--color-primary);">${s.label}:</span>
          <span style="color: var(--color-text-muted);">${s.value}</span>
        </div>
      `).join('');
    } else {
      specsEl.innerHTML = '<p style="font-size: 0.88rem; color: #9CA3AF; font-style: italic;">Specifications will be updated based on the final product catalogue.</p>';
    }
  }

  // Quote Button dataset
  if (quoteBtn) {
    quoteBtn.setAttribute('data-product', product.name);
    quoteBtn.onclick = () => {
      modal.classList.remove('active');
      const quoteModal = document.getElementById('quoteModal');
      const reqInput = document.getElementById('modalRequirement');
      if (reqInput) reqInput.value = `Enquiry for: ${product.name}`;
      if (quoteModal) quoteModal.classList.add('active');
    };
  }

  // Brochure Button
  if (brochureContainer) {
    if (product.brochure && product.brochure.trim() !== '') {
      brochureContainer.innerHTML = `
        <a href="${product.brochure}" download="${product.slug || 'product'}-brochure.pdf" class="btn btn-outline-navy btn-sm" aria-label="Download ${product.name} brochure">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download Brochure</span>
        </a>
      `;
    } else {
      brochureContainer.innerHTML = `
        <button class="btn btn-outline-navy btn-sm disabled" onclick="showFloatingNotification('Brochure is currently unavailable. Please contact us for product information.', 'error')">
          <span>Brochure Coming Soon</span>
        </button>
      `;
    }
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function createProductDetailModalDOM() {
  const modalDiv = document.createElement('div');
  modalDiv.id = 'productDetailModal';
  modalDiv.className = 'modal-overlay';
  modalDiv.innerHTML = `
    <div class="modal-container" style="max-width: 750px;">
      <div class="modal-header">
        <h3 id="detailProductName">Product Details</h3>
        <button class="modal-close" onclick="closeProductDetailModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start;">
          <div>
            <img id="detailProductImage" src="" alt="" style="width: 100%; border-radius: 8px; border: 1px solid var(--color-border); background-color: var(--color-bg-light); object-fit: cover; max-height: 280px;">
            <div style="margin-top: 12px; display: inline-block; padding: 4px 10px; background-color: var(--color-gold-light); color: var(--color-primary); font-size: 0.8rem; font-weight: 700; border-radius: 4px;" id="detailProductCategory"></div>
          </div>
          <div>
            <h4 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 10px;">Product Description</h4>
            <p id="detailProductDesc" style="font-size: 0.95rem; color: var(--color-text-main); line-height: 1.6; margin-bottom: 20px;"></p>
            
            <h4 style="font-size: 1rem; color: var(--color-primary); margin-bottom: 10px;">Specifications</h4>
            <div id="detailProductSpecs" style="margin-bottom: 24px;"></div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap;" id="modalActionButtons">
              <button class="btn btn-gold btn-sm" id="detailQuoteBtn">Request a Quote</button>
              <div id="detailBrochureContainer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalDiv);

  modalDiv.addEventListener('click', (e) => {
    if (e.target === modalDiv) {
      closeProductDetailModal();
    }
  });

  return modalDiv;
}

function closeProductDetailModal() {
  const modal = document.getElementById('productDetailModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Auto Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initDynamicProductsPage();
});
