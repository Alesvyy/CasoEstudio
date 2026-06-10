/**
 * Teknovation — Main Application Script
 * Clean architecture: single DOMContentLoaded, separated concerns,
 * proper state management, accessible UI components.
 */

'use strict';

// ============================================================
// 1. CONSTANTS & CONFIGURATION
// ============================================================
const CONFIG = {
  CART_KEY:        'teknovation_cart',
  USER_KEY:        'teknovation_user',
  SLIDE_INTERVAL:  5000,
  FREE_SHIPPING:   39,
  SHIPPING_COST:   5.99,
  PROMO_CODES: {
    'GAMING10': { type: 'percent', value: 10, label: '10% de descuento' },
    'TEKNO20':  { type: 'percent', value: 20, label: '20% de descuento' },
    'BUNDLE30': { type: 'fixed',   value: 30, label: '30€ de descuento' },
  },
  BUNDLE_PROMO_THRESHOLD: 2,
  BUNDLE_PROMO_DISCOUNT:  30,
};

// ============================================================
// 2. STATE
// ============================================================
const state = {
  cart:         [],   // { id, productId, name, price, quantity, color, icon }
  productsData: null, // raw JSON from products.json
  currentUser:  null, // { name, email, registeredAt }
  appliedPromo: null, // { code, type, value, label }
};

// ============================================================
// 3. UTILITIES
// ============================================================

/** Debounce: delay function execution until after `wait` ms of inactivity */
function debounce(fn, wait = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Format number as Spanish price string */
function formatPrice(num) {
  return num.toFixed(2).replace('.', ',') + ' €';
}

/** Safely escape HTML to prevent XSS */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/** Get total item count from cart */
function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

/** Generate a unique ID */
function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Check if current page contains a path segment */
function isPage(segment) {
  return window.location.pathname.includes(segment);
}

// ============================================================
// 4. TOAST NOTIFICATIONS (replaces showNotification + showAddToCartNotification)
// ============================================================

function createToastContainer() {
  if (document.getElementById('toastContainer')) return;
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'false');
  document.body.appendChild(container);
}

/**
 * Show a Bootstrap toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };

  const toastEl = document.createElement('div');
  toastEl.className = `toast tekno-toast tekno-toast--${type}`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="toast-body">
        <span class="material-icons" aria-hidden="true" style="font-size:20px">${icons[type] || 'info'}</span>
        ${escapeHtml(message)}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>`;

  container.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

// ============================================================
// 5. CART STORAGE
// ============================================================

function saveCartToStorage() {
  try {
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(state.cart));
  } catch (e) {
    console.error('[Cart] Storage error:', e);
  }
}

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem(CONFIG.CART_KEY);
    if (saved) {
      state.cart = JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Cart] Load error:', e);
    state.cart = [];
  }
}

/** Update all .cart-count badges throughout the page */
function updateCartCount() {
  const count = getCartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.setAttribute('aria-label', `${count} artículos en el carrito`);
  });
}

// ============================================================
// 6. CART DRAWER (Bootstrap Offcanvas injected into DOM)
// ============================================================

function createCartDrawer() {
  if (document.getElementById('cartDrawer')) return;

  const drawer = document.createElement('div');
  drawer.className = 'offcanvas offcanvas-end';
  drawer.id = 'cartDrawer';
  drawer.tabIndex = -1;
  drawer.setAttribute('aria-labelledby', 'cartDrawerTitle');
  drawer.innerHTML = `
    <div class="offcanvas-header">
      <h5 class="offcanvas-title" id="cartDrawerTitle">
        <span class="material-icons" aria-hidden="true">shopping_cart</span>
        Carrito (<span id="drawerItemCount">0</span>)
      </h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar carrito"></button>
    </div>

    <div id="drawerEmpty" style="display:none;">
      <span class="material-icons" aria-hidden="true">shopping_cart</span>
      <h4>Tu carrito está vacío</h4>
      <p>Añade productos para comenzar</p>
      <a href="shop.html" class="btn btn-primary" data-bs-dismiss="offcanvas">
        Explorar Productos
      </a>
    </div>

    <div id="drawerBody" style="display:none;"></div>

    <div id="drawerFooter" style="display:none;">
      <div class="drawer-total">
        <span>Total</span>
        <span id="drawerTotal">0,00 €</span>
      </div>
      <div class="drawer-footer-btns">
        <a href="cart.html" class="btn btn-primary" data-bs-dismiss="offcanvas">
          <span class="material-icons" aria-hidden="true">shopping_bag</span>
          Ver Carrito
        </a>
        <button class="btn btn-secondary" data-bs-dismiss="offcanvas">
          Seguir Comprando
        </button>
      </div>
    </div>`;

  document.body.appendChild(drawer);

  // Event delegation for qty changes and removal
  drawer.addEventListener('click', handleDrawerClick);
}

function renderCartDrawer() {
  const drawerEmpty  = document.getElementById('drawerEmpty');
  const drawerBody   = document.getElementById('drawerBody');
  const drawerFooter = document.getElementById('drawerFooter');
  const drawerCount  = document.getElementById('drawerItemCount');
  const drawerTotal  = document.getElementById('drawerTotal');

  if (!drawerEmpty) return;

  const count = getCartCount();
  if (drawerCount) drawerCount.textContent = count;

  if (state.cart.length === 0) {
    drawerEmpty.style.display  = 'flex';
    drawerBody.style.display   = 'none';
    drawerFooter.style.display = 'none';
    return;
  }

  drawerEmpty.style.display  = 'none';
  drawerBody.style.display   = 'block';
  drawerFooter.style.display = 'block';

  drawerBody.innerHTML = state.cart.map(renderDrawerItem).join('');

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (drawerTotal) drawerTotal.textContent = formatPrice(total);
}

function renderDrawerItem(item) {
  return `
    <div class="drawer-item" data-item-id="${escapeHtml(item.id)}">
      <div class="drawer-item__image">
        <span class="material-icons" aria-hidden="true">${escapeHtml(item.icon || 'devices')}</span>
      </div>
      <div class="drawer-item__info">
        <div class="drawer-item__header">
          <div class="drawer-item__name">${escapeHtml(item.name)}</div>
          <button class="drawer-item__remove" data-action="remove" data-item-id="${escapeHtml(item.id)}"
                  aria-label="Eliminar ${escapeHtml(item.name)} del carrito">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>
        <div class="drawer-item__variant">${escapeHtml(item.color || '')}</div>
        <div class="drawer-item__footer">
          <div class="drawer-qty" role="group" aria-label="Cantidad">
            <button class="drawer-qty-btn" data-action="qty-minus" data-item-id="${escapeHtml(item.id)}"
                    aria-label="Reducir cantidad" ${item.quantity <= 1 ? 'disabled' : ''}>
              <span class="material-icons" aria-hidden="true">remove</span>
            </button>
            <span class="drawer-qty-value" aria-label="Cantidad: ${item.quantity}">${item.quantity}</span>
            <button class="drawer-qty-btn" data-action="qty-plus" data-item-id="${escapeHtml(item.id)}"
                    aria-label="Aumentar cantidad" ${item.quantity >= 10 ? 'disabled' : ''}>
              <span class="material-icons" aria-hidden="true">add</span>
            </button>
          </div>
          <div class="drawer-item__price">${formatPrice(item.price * item.quantity)}</div>
        </div>
      </div>
    </div>`;
}

function handleDrawerClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const itemId = btn.dataset.itemId;

  if (action === 'remove') {
    removeFromCart(itemId);
  } else if (action === 'qty-minus') {
    const item = state.cart.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      updateCartQuantity(itemId, item.quantity - 1);
    }
  } else if (action === 'qty-plus') {
    const item = state.cart.find(i => i.id === itemId);
    if (item && item.quantity < 10) {
      updateCartQuantity(itemId, item.quantity + 1);
    }
  }
}

// ============================================================
// 7. CART OPERATIONS
// ============================================================

/**
 * Add a product to the cart by its ID
 * If already in cart with same color, increments quantity instead
 */
function addToCartById(productId, quantity = 1, color = null) {
  if (!state.productsData) return;

  const product = state.productsData.products.find(p => p.id === productId);
  if (!product || !product.inStock) return;

  const selectedColor = color || product.colors[0] || '';

  // Check if item already exists with same product + color
  const existing = state.cart.find(
    i => i.productId === productId && i.color === selectedColor
  );

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, 10);
  } else {
    state.cart.push({
      id:        uid(),
      productId: product.id,
      name:      product.name,
      price:     product.price,
      quantity:  Math.min(quantity, 10),
      color:     selectedColor,
      icon:      Array.isArray(product.images) ? product.images[0] : 'devices',
    });
  }

  saveCartToStorage();
  updateCartCount();
  renderCartDrawer();
  showToast(`${product.name} añadido al carrito`, 'success');
}

function removeFromCart(itemId) {
  const idx = state.cart.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  const name = state.cart[idx].name;
  state.cart.splice(idx, 1);
  saveCartToStorage();
  updateCartCount();
  renderCartDrawer();
  // If on cart page, re-render table
  if (isPage('cart.html')) renderCartTable();
  showToast(`${name} eliminado del carrito`, 'info');
}

function updateCartQuantity(itemId, newQty) {
  const item = state.cart.find(i => i.id === itemId);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(newQty, 10));
  saveCartToStorage();
  updateCartCount();
  renderCartDrawer();
  if (isPage('cart.html')) {
    renderCartTable();
    updateOrderSummary();
  }
}

function clearCart() {
  state.cart = [];
  state.appliedPromo = null;
  saveCartToStorage();
  updateCartCount();
  renderCartDrawer();
}

// ============================================================
// 8. SEARCH (replaces prompt() with Bootstrap Modal)
// ============================================================

function createSearchModal() {
  if (document.getElementById('searchModal')) return;

  const modal = document.createElement('div');
  modal.className = 'modal fade search-modal';
  modal.id = 'searchModal';
  modal.tabIndex = -1;
  modal.setAttribute('aria-label', 'Buscar productos');
  modal.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body">
          <div class="search-modal-input-wrap">
            <span class="material-icons search-icon" aria-hidden="true">search</span>
            <input type="search" id="searchInput"
                   placeholder="Buscar ratones, teclados, auriculares..."
                   autocomplete="off" autocorrect="off"
                   aria-label="Buscar productos"
                   aria-autocomplete="list"
                   aria-controls="searchResults" />
            <button type="button" class="search-close-btn"
                    data-bs-dismiss="modal" aria-label="Cerrar búsqueda">
              <span class="material-icons" aria-hidden="true">close</span>
            </button>
          </div>

          <div class="search-chips" id="searchChips" role="group" aria-label="Búsquedas rápidas">
            <button class="search-chip" data-query="PRO">PRO Series</button>
            <button class="search-chip" data-query="inalámbrico">Inalámbrico</button>
            <button class="search-chip" data-query="RGB">RGB</button>
            <button class="search-chip" data-query="ambidiestro">Ambidiestro</button>
            <button class="search-chip" data-query="">Ver todos</button>
          </div>

          <div id="searchResults" role="listbox" aria-label="Resultados de búsqueda"></div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function initializeSearch() {
  const searchModal = document.getElementById('searchModal');
  if (!searchModal) return;

  // Focus input when modal opens
  searchModal.addEventListener('shown.bs.modal', () => {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = '';
      input.focus();
      renderSearchResults(state.productsData?.products || [], '');
    }
  });

  // Real-time search with debounce
  const debouncedSearch = debounce(query => {
    if (!state.productsData) return;
    const results = searchProducts(query);
    renderSearchResults(results, query);
  }, 250);

  document.addEventListener('input', e => {
    if (e.target.id === 'searchInput') {
      debouncedSearch(e.target.value.trim());
    }
  });

  // Chip buttons
  document.addEventListener('click', e => {
    const chip = e.target.closest('.search-chip');
    if (!chip) return;

    document.querySelectorAll('.search-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const query = chip.dataset.query || '';
    const input = document.getElementById('searchInput');
    if (input) input.value = query;

    if (state.productsData) {
      renderSearchResults(searchProducts(query), query);
    }
  });
}

function searchProducts(query) {
  if (!state.productsData?.products) return [];
  if (!query) return state.productsData.products;

  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return state.productsData.products.filter(p => {
    const name     = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const subtitle = p.subtitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const series   = p.series.toLowerCase();
    const desc     = (p.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const feats    = (p.features || []).join(' ').toLowerCase();

    return name.includes(q) || subtitle.includes(q) || series.includes(q) ||
           desc.includes(q) || feats.includes(q);
  });
}

function renderSearchResults(results, query) {
  const container = document.getElementById('searchResults');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `
      <div class="search-no-results">
        <span class="material-icons" aria-hidden="true">search_off</span>
        <p>No se encontraron resultados${query ? ` para "<strong>${escapeHtml(query)}</strong>"` : ''}</p>
      </div>`;
    return;
  }

  const shown = results.slice(0, 8);
  container.innerHTML = shown.map(p => `
    <a href="product.html?id=${escapeHtml(p.id)}"
       class="search-result-item"
       role="option"
       data-bs-dismiss="modal"
       aria-label="${escapeHtml(p.name)} — ${formatPrice(p.price)}">
      <div class="search-result-image" aria-hidden="true">
        <span class="material-icons">${escapeHtml(Array.isArray(p.images) ? p.images[0] : 'devices')}</span>
      </div>
      <div style="min-width:0">
        <div class="search-result-name">${escapeHtml(p.name)}</div>
        <div class="search-result-subtitle">${escapeHtml(p.subtitle)}</div>
      </div>
      <div class="search-result-price">${formatPrice(p.price)}</div>
    </a>`).join('');

  if (results.length > 8) {
    container.insertAdjacentHTML('beforeend', `
      <div style="text-align:center; padding:0.75rem;">
        <a href="shop.html" data-bs-dismiss="modal"
           style="color:var(--primary-color); font-weight:600; text-decoration:none; font-size:0.875rem;">
          Ver los ${results.length} resultados en la tienda
        </a>
      </div>`);
  }
}

// ============================================================
// 9. DATA LOADING
// ============================================================

async function loadProductsData() {
  if (state.productsData) return state.productsData;
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.productsData = await response.json();
    return state.productsData;
  } catch (error) {
    console.error('[Products] Failed to load products.json:', error);
    return null;
  }
}

// ============================================================
// 10. SHOP PAGE
// ============================================================

async function initializeShopPage() {
  if (!state.productsData) await loadProductsData();
  if (!state.productsData) return;

  // Apply category filter from URL if present
  const urlParams   = new URLSearchParams(window.location.search);
  const category    = urlParams.get('category');

  renderProducts(state.productsData.products);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = products.map(p => `
    <div class="product-card"
         data-series="${escapeHtml(p.series)}"
         data-price="${p.price}"
         data-connectivity="${escapeHtml(p.connectivity)}"
         data-features="${escapeHtml((p.features || []).join(','))}">
      <a href="product.html?id=${escapeHtml(p.id)}" class="product-link">
        ${p.isNew      ? '<div class="product-badge" aria-label="Nuevo">Nuevo</div>' : ''}
        ${p.discount   ? `<div class="product-badge badge-offer" aria-label="Oferta -${p.discount}%">-${p.discount}%</div>` : ''}
        <div class="product-image" aria-hidden="true">
          <div class="product-image-placeholder">
            <span class="material-icons">${escapeHtml(Array.isArray(p.images) ? p.images[0] : 'devices')}</span>
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-subtitle">${escapeHtml(p.subtitle)}</p>
          <div class="product-price">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="price-original">${formatPrice(p.originalPrice)}</span>` : ''}
          </div>
          ${!p.inStock ? '<div class="product-status out-of-stock">Agotado temporalmente</div>' : ''}
        </div>
      </a>
      <div class="product-actions">
        ${p.inStock
          ? `<button class="btn btn-primary btn-add-cart"
                     data-product-id="${escapeHtml(p.id)}"
                     aria-label="Añadir ${escapeHtml(p.name)} al carrito">
               <span class="material-icons" aria-hidden="true">shopping_cart</span>
               Añadir al carrito
             </button>`
          : ''}
        <button class="btn-icon wishlist-btn" aria-label="Añadir ${escapeHtml(p.name)} a favoritos" aria-pressed="false">
          <span class="material-icons" aria-hidden="true">favorite_border</span>
        </button>
      </div>
    </div>`).join('');

  // Update count
  const countEl = document.getElementById('productCount');
  if (countEl) countEl.textContent = products.length;

  // Attach add-to-cart listeners (event delegation)
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-cart');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      addToCartById(btn.dataset.productId);
    }
  });

  // Wishlist (event delegation)
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.wishlist-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlistBtn(btn);
    }
  });
}

function toggleWishlistBtn(btn) {
  const icon     = btn.querySelector('.material-icons');
  const isActive = icon.textContent === 'favorite';
  icon.textContent = isActive ? 'favorite_border' : 'favorite';
  icon.style.color = isActive ? '' : 'var(--error-color)';
  btn.setAttribute('aria-pressed', String(!isActive));
  showToast(isActive ? 'Eliminado de favoritos' : 'Añadido a favoritos', isActive ? 'info' : 'success');
}

// ============================================================
// 11. SHOP FILTERS
// ============================================================

function initializeFilters() {
  const sidebar         = document.getElementById('filtersSidebar');
  const toggleFiltersBtn= document.getElementById('toggleFilters');
  const mobileFiltersBtn= document.getElementById('mobileFiltersBtn');
  const closeFiltersBtn = document.getElementById('closeFilters');
  const overlay         = document.getElementById('mobileOverlay');
  const sortSelect      = document.getElementById('sortSelect');
  const clearFiltersBtn = document.querySelector('.btn-clear-filters');

  if (!sidebar) return;

  const openFilters = () => {
    sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeFilters = () => {
    sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (toggleFiltersBtn) toggleFiltersBtn.addEventListener('click', openFilters);
  if (mobileFiltersBtn) mobileFiltersBtn.addEventListener('click', openFilters);
  if (closeFiltersBtn)  closeFiltersBtn.addEventListener('click', closeFilters);

  sidebar.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', filterAndSortProducts);
  });

  if (sortSelect)      sortSelect.addEventListener('change', filterAndSortProducts);

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      sidebar.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      filterAndSortProducts();
    });
  }
}

function filterAndSortProducts() {
  if (!state.productsData) return;

  const activeFilters = { connectivity: [], series: [], price: [], features: [] };

  document.querySelectorAll('.filter-option input[type="checkbox"]:checked').forEach(cb => {
    if (activeFilters[cb.name]) activeFilters[cb.name].push(cb.value);
  });

  let filtered = state.productsData.products.filter(p => {
    if (activeFilters.connectivity.length && !activeFilters.connectivity.includes(p.connectivity)) return false;
    if (activeFilters.series.length       && !activeFilters.series.includes(p.series))            return false;
    if (activeFilters.features.length) {
      const hasAll = activeFilters.features.every(f => (p.features || []).includes(f));
      if (!hasAll) return false;
    }
    if (activeFilters.price.length) {
      const matches = activeFilters.price.some(range => {
        const [min, max] = range.split('-').map(Number);
        if (range === '150+') return p.price >= 150;
        return p.price >= min && p.price < max;
      });
      if (!matches) return false;
    }
    return true;
  });

  // Sort
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    switch (sortSelect.value) {
      case 'price-asc':  filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'name':       filtered.sort((a, b) => a.name.localeCompare(b.name, 'es')); break;
      case 'newest':     filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
  }

  renderProducts(filtered);
}

// ============================================================
// 12. PRODUCT DETAIL PAGE
// ============================================================

async function initializeProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  if (!productId) return;

  if (!state.productsData) await loadProductsData();
  if (!state.productsData) return;

  const product = state.productsData.products.find(p => p.id === productId);
  if (!product) return;

  updateProductPage(product);
}

function updateProductPage(product) {
  // Breadcrumb
  const breadcrumb = document.querySelector('.breadcrumb li[aria-current="page"]');
  if (breadcrumb) breadcrumb.textContent = product.name;

  // Series badge
  const badge = document.querySelector('.product-badge-series');
  if (badge) badge.textContent = product.series.toUpperCase() + ' Series';

  // Title, description
  const title = document.querySelector('.product-title');
  if (title) title.textContent = product.name;

  const desc = document.querySelector('.product-description');
  if (desc) desc.textContent = product.subtitle;

  // Rating
  const ratingCount = document.querySelector('.rating-count');
  if (ratingCount) ratingCount.textContent = `(${product.reviewCount} reseñas)`;

  // Price
  const priceEl = document.querySelector('.product-price-large .price-current');
  if (priceEl) priceEl.textContent = formatPrice(product.price);

  // Colors
  const colorOptions = document.querySelector('.color-options');
  if (colorOptions && product.colors) {
    colorOptions.innerHTML = product.colors.map((color, i) => `
      <button class="color-option ${i === 0 ? 'active' : ''}"
              data-color="${escapeHtml(color.toLowerCase())}"
              aria-label="Color ${escapeHtml(color)}"
              aria-pressed="${i === 0}">
        <span class="color-swatch" style="background:${getColorHex(color)}${color === 'Blanco' ? ';border:1px solid #ddd' : ''}"></span>
        <span class="color-name">${escapeHtml(color)}</span>
      </button>`).join('');

    colorOptions.querySelectorAll('.color-option').forEach(btn => {
      btn.addEventListener('click', function () {
        colorOptions.querySelectorAll('.color-option').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-pressed', 'true');
      });
    });
  }

  // Stock state
  if (!product.inStock) {
    const addToCartBtn = document.getElementById('addToCart');
    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      addToCartBtn.innerHTML = '<span class="material-icons" aria-hidden="true">info</span> Agotado temporalmente';
      addToCartBtn.style.opacity = '0.6';
      addToCartBtn.style.cursor = 'not-allowed';
    }
  }

  // Store product ID for cart
  document.querySelector('.product-details')?.setAttribute('data-product-id', product.id);

  // Description tab
  const descTab = document.getElementById('description');
  if (descTab && product.features_list) {
    descTab.innerHTML = `
      <h2>Descripción del Producto</h2>
      <p>${escapeHtml(product.description)}</p>
      <h3>Características Principales:</h3>
      <ul>${product.features_list.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`;
  }

  // Specs tab
  const specsTab = document.getElementById('specs');
  if (specsTab && product.specifications) {
    specsTab.innerHTML = `
      <h2>Especificaciones Técnicas</h2>
      <div class="specs-grid">
        ${Object.entries(product.specifications).map(([k, v]) => `
          <div class="spec-item">
            <h4>${escapeHtml(formatSpecKey(k))}</h4>
            <p>${escapeHtml(v)}</p>
          </div>`).join('')}
      </div>`;
  }

  // Reviews tab
  const reviewsBtn = document.querySelector('.tab-btn[data-tab="reviews"]');
  if (reviewsBtn) reviewsBtn.textContent = `Reseñas (${product.reviewCount})`;

  // Page title
  document.title = `${product.name} | Teknovation`;
}

function getColorHex(colorName) {
  const map = {
    'Negro':  '#000000', 'Blanco': '#ffffff', 'Rosa':  '#ff69b4',
    'Azul':   '#1e90ff', 'Lila':   '#9370db', 'Rojo':  '#dc143c',
    'Verde':  '#32cd32',
  };
  return map[colorName] || '#000000';
}

function formatSpecKey(key) {
  const map = {
    sensor: 'Sensor', connectivity: 'Conectividad', responseRate: 'Velocidad de Respuesta',
    weight: 'Peso', battery: 'Batería', buttons: 'Botones Programables',
    dimensions: 'Dimensiones', compatibility: 'Compatible con',
  };
  return map[key] || key;
}

// ============================================================
// 13. CART PAGE
// ============================================================

async function initializeCartPage() {
  if (!state.productsData) await loadProductsData();

  renderCartTable();
  updateOrderSummary();
  renderRecommended();

  // Clear cart button
  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('¿Seguro que quieres vaciar el carrito?')) return;
      clearCart();
      renderCartTable();
      updateOrderSummary();
      showToast('Carrito vaciado', 'info');
    });
  }

  // Coupon
  const applyBtn   = document.getElementById('applyCoupon');
  const couponInput= document.getElementById('couponInput');
  if (applyBtn && couponInput) {
    applyBtn.addEventListener('click', () => applyCoupon(couponInput.value.trim().toUpperCase()));
    couponInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyCoupon(couponInput.value.trim().toUpperCase());
    });
  }

  // Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

  // Table events (delegation)
  const tableBody = document.getElementById('cartTableBody');
  if (tableBody) {
    tableBody.addEventListener('click', handleCartTableClick);
    tableBody.addEventListener('change', handleCartTableChange);
  }
}

function renderCartTable() {
  const emptyEl   = document.getElementById('cartEmpty');
  const contentEl = document.getElementById('cartContent');
  const tableBody = document.getElementById('cartTableBody');
  const titleEl   = document.getElementById('cartPageTitle');
  const clearBtn  = document.getElementById('clearCartBtn');
  const recSection= document.getElementById('recommendedSection');

  if (!emptyEl) return;

  const count = getCartCount();

  if (titleEl) {
    titleEl.textContent = count > 0 ? `(${count} ${count === 1 ? 'artículo' : 'artículos'})` : '';
  }

  if (state.cart.length === 0) {
    emptyEl.style.display   = 'flex';
    if (contentEl) contentEl.style.display = 'none';
    if (clearBtn)  clearBtn.style.display  = 'none';
    if (recSection) recSection.style.display = 'none';
    return;
  }

  emptyEl.style.display   = 'none';
  if (contentEl) contentEl.style.display = '';
  if (clearBtn)  clearBtn.style.display  = '';
  if (recSection) recSection.style.display = '';

  if (tableBody) {
    tableBody.innerHTML = state.cart.map(item => `
      <tr data-item-id="${escapeHtml(item.id)}">
        <td>
          <div class="cart-product-cell">
            <div class="cart-product-cell__image" aria-hidden="true">
              <span class="material-icons">${escapeHtml(item.icon || 'devices')}</span>
            </div>
            <div>
              <div class="cart-product-cell__name">${escapeHtml(item.name)}</div>
              <div class="cart-product-cell__variant">${escapeHtml(item.color || '')}</div>
            </div>
          </div>
        </td>
        <td class="cart-item-price">${formatPrice(item.price)}</td>
        <td>
          <div class="cart-qty-control" role="group" aria-label="Cantidad para ${escapeHtml(item.name)}">
            <button class="qty-btn" data-action="minus" data-item-id="${escapeHtml(item.id)}"
                    aria-label="Reducir cantidad" ${item.quantity <= 1 ? 'disabled' : ''}>
              <span class="material-icons" aria-hidden="true">remove</span>
            </button>
            <input type="number" value="${item.quantity}" min="1" max="10"
                   data-item-id="${escapeHtml(item.id)}"
                   aria-label="Cantidad"
                   class="cart-qty-input" />
            <button class="qty-btn" data-action="plus" data-item-id="${escapeHtml(item.id)}"
                    aria-label="Aumentar cantidad" ${item.quantity >= 10 ? 'disabled' : ''}>
              <span class="material-icons" aria-hidden="true">add</span>
            </button>
          </div>
        </td>
        <td class="cart-item-total">${formatPrice(item.price * item.quantity)}</td>
        <td>
          <button class="cart-item-remove" data-action="remove" data-item-id="${escapeHtml(item.id)}"
                  aria-label="Eliminar ${escapeHtml(item.name)} del carrito">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </td>
      </tr>`).join('');
  }

  updateOrderSummary();
}

function handleCartTableClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const itemId = btn.dataset.itemId;
  const item   = state.cart.find(i => i.id === itemId);
  if (!item) return;

  if (action === 'remove') {
    removeFromCart(itemId);
    renderCartTable();
  } else if (action === 'minus') {
    updateCartQuantity(itemId, item.quantity - 1);
    renderCartTable();
  } else if (action === 'plus') {
    updateCartQuantity(itemId, item.quantity + 1);
    renderCartTable();
  }
}

function handleCartTableChange(e) {
  if (!e.target.classList.contains('cart-qty-input')) return;
  const itemId = e.target.dataset.itemId;
  const newQty = parseInt(e.target.value, 10);
  if (isNaN(newQty) || newQty < 1) { e.target.value = 1; return; }
  updateCartQuantity(itemId, newQty);
  renderCartTable();
}

function applyCoupon(code) {
  const feedbackEl = document.getElementById('couponFeedback');
  if (!feedbackEl) return;

  if (!code) {
    feedbackEl.textContent = 'Introduce un código de descuento';
    feedbackEl.className = 'coupon-feedback error';
    return;
  }

  const promo = CONFIG.PROMO_CODES[code];
  if (!promo) {
    feedbackEl.textContent = 'Código no válido';
    feedbackEl.className = 'coupon-feedback error';
    return;
  }

  state.appliedPromo = { code, ...promo };
  feedbackEl.textContent = `¡Descuento aplicado: ${promo.label}!`;
  feedbackEl.className = 'coupon-feedback success';
  updateOrderSummary();
  showToast(`Código ${code} aplicado — ${promo.label}`, 'success');
}

function updateOrderSummary() {
  const subtotalEl     = document.getElementById('summarySubtotal');
  const discountRow    = document.getElementById('discountRow');
  const discountEl     = document.getElementById('summaryDiscount');
  const shippingEl     = document.getElementById('summaryShipping');
  const totalEl        = document.getElementById('summaryTotal');
  const itemCountEl    = document.getElementById('summaryItemCount');
  const promoAlert     = document.getElementById('promoAlert');
  const promoAlertText = document.getElementById('promoAlertText');

  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let   discount = 0;

  if (state.appliedPromo) {
    if (state.appliedPromo.type === 'percent') {
      discount = subtotal * (state.appliedPromo.value / 100);
    } else {
      discount = Math.min(state.appliedPromo.value, subtotal);
    }
  }

  // Bundle promo (30€ off 2+ different items)
  const uniqueItems = new Set(state.cart.map(i => i.productId)).size;
  if (promoAlert && promoAlertText) {
    if (uniqueItems >= CONFIG.BUNDLE_PROMO_THRESHOLD) {
      promoAlert.style.display = 'none';
    } else {
      promoAlert.style.display = 'flex';
      const needed = CONFIG.BUNDLE_PROMO_THRESHOLD - uniqueItems;
      promoAlertText.textContent = `Añade ${needed} artículo${needed > 1 ? 's' : ''} más y obtén ${CONFIG.BUNDLE_PROMO_DISCOUNT}€ de descuento`;
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping      = afterDiscount >= CONFIG.FREE_SHIPPING ? 0 : CONFIG.SHIPPING_COST;
  const total         = afterDiscount + shipping;
  const count         = getCartCount();

  if (subtotalEl)  subtotalEl.textContent  = formatPrice(subtotal);
  if (itemCountEl) itemCountEl.textContent  = count;

  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent    = `-${formatPrice(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (shippingEl) {
    shippingEl.textContent = shipping === 0 ? 'Gratis' : formatPrice(shipping);
  }

  if (totalEl) totalEl.textContent = formatPrice(total);
}

function handleCheckout() {
  if (state.cart.length === 0) {
    showToast('Tu carrito está vacío', 'warning');
    return;
  }

  // Check auth
  if (!state.currentUser) {
    showToast('Inicia sesión para finalizar tu compra', 'info');
    setTimeout(() => { window.location.href = 'auth.html'; }, 1500);
    return;
  }

  // Simulate order creation
  const orderNumber = 'TKN-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const orderEl = document.getElementById('orderNumber');
  if (orderEl) orderEl.textContent = `#${orderNumber}`;

  // Show success modal
  const modalEl = document.getElementById('checkoutSuccessModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  // Clear cart after confirmation
  clearCart();
  renderCartTable();
  updateOrderSummary();
}

function renderRecommended() {
  const container = document.getElementById('recommendedProducts');
  if (!container || !state.productsData) return;

  const recommended = state.productsData.products.slice(0, 4);

  container.innerHTML = recommended.map(p => `
    <div class="product-card">
      <a href="product.html?id=${escapeHtml(p.id)}" class="product-link">
        <div class="product-image" aria-hidden="true">
          <div class="product-image-placeholder">
            <span class="material-icons">${escapeHtml(Array.isArray(p.images) ? p.images[0] : 'devices')}</span>
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-subtitle">${escapeHtml(p.subtitle)}</p>
          <div class="product-price">
            <span class="price-current">${formatPrice(p.price)}</span>
          </div>
        </div>
      </a>
    </div>`).join('');
}

// ============================================================
// 14. AUTH PAGE
// ============================================================

function loadUserFromStorage() {
  try {
    const saved = localStorage.getItem(CONFIG.USER_KEY);
    if (saved) state.currentUser = JSON.parse(saved);
  } catch (e) {
    state.currentUser = null;
  }
}

function saveUserToStorage(user) {
  try {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
  } catch (e) { /* noop */ }
}

/** Update header account button based on auth state */
function updateAuthUI() {
  const accountBtn = document.getElementById('accountBtn');
  if (!accountBtn) return;

  if (state.currentUser) {
    const icon = accountBtn.querySelector('.material-icons');
    if (icon) icon.textContent = 'person';
    accountBtn.title = `Mi cuenta (${state.currentUser.name})`;
    accountBtn.setAttribute('aria-label', `Mi cuenta: ${state.currentUser.name}`);
  }
}

function initializeAuthPage() {
  // If already logged in, show success state directly
  if (state.currentUser) {
    showAuthSuccess('login', state.currentUser.name);
  }

  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  // Password toggles
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => togglePasswordVisibility(btn.dataset.target, btn));
  });

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
    // Real-time validation
    document.getElementById('loginEmail')?.addEventListener('input', e => {
      const r = validateEmail(e.target.value);
      setFieldState(e.target, 'loginEmailStatus', 'loginEmailError', r.valid, r.message);
    });
    document.getElementById('loginPassword')?.addEventListener('input', e => {
      const r = validateLoginPassword(e.target.value);
      setFieldState(e.target, null, 'loginPasswordError', r.valid, r.message);
    });
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
    // Real-time validation
    document.getElementById('firstName')?.addEventListener('input', e => {
      const r = validateName(e.target.value, 'nombre');
      setFieldState(e.target, 'firstNameStatus', 'firstNameError', r.valid, r.message);
    });
    document.getElementById('lastName')?.addEventListener('input', e => {
      const r = validateName(e.target.value, 'apellido');
      setFieldState(e.target, 'lastNameStatus', 'lastNameError', r.valid, r.message);
    });
    document.getElementById('registerEmail')?.addEventListener('input', e => {
      const r = validateEmail(e.target.value);
      setFieldState(e.target, 'registerEmailStatus', 'registerEmailError', r.valid, r.message);
    });
    document.getElementById('phone')?.addEventListener('input', e => {
      const r = validatePhone(e.target.value);
      setFieldState(e.target, 'phoneStatus', 'phoneError', r.valid, r.message);
    });
    document.getElementById('registerPassword')?.addEventListener('input', e => {
      const r = validatePassword(e.target.value);
      setFieldState(e.target, null, 'registerPasswordError', r.valid, r.message);
      updatePasswordStrength(r.strength);
    });
    document.getElementById('confirmPassword')?.addEventListener('input', e => {
      const password = document.getElementById('registerPassword')?.value || '';
      const r = validatePasswordConfirm(e.target.value, password);
      setFieldState(e.target, null, 'confirmPasswordError', r.valid, r.message);
    });
  }

  // Forgot password
  document.getElementById('forgotPasswordBtn')?.addEventListener('click', () => {
    showToast('Revisa tu email para restablecer tu contraseña (simulación)', 'info');
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem(CONFIG.USER_KEY);
    state.currentUser = null;
    document.getElementById('authSuccess').style.display = 'none';
    document.getElementById('loginPanel').classList.add('active');
    document.getElementById('loginTab').classList.add('active');
    showToast('Sesión cerrada', 'info');
  });
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
    t.setAttribute('aria-selected', String(t.dataset.tab === tab));
  });
  document.querySelectorAll('.auth-form-panel').forEach(p => {
    p.classList.toggle('active', p.id === tab + 'Panel');
  });
  document.getElementById('authSuccess').style.display = 'none';
}

function togglePasswordVisibility(targetId, btn) {
  const input = document.getElementById(targetId);
  const icon  = btn?.querySelector('.material-icons');
  if (!input) return;

  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (icon) icon.textContent = isHidden ? 'visibility' : 'visibility_off';
  btn?.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
}

/** Apply valid/invalid classes and show error message */
function setFieldState(inputEl, statusElId, errorElId, isValid, message) {
  if (!inputEl) return;

  inputEl.classList.toggle('is-valid',   isValid);
  inputEl.classList.toggle('is-invalid', !isValid && inputEl.value.length > 0);

  const statusEl = statusElId ? document.getElementById(statusElId) : null;
  if (statusEl) {
    statusEl.textContent = isValid ? 'check_circle' : 'error';
    statusEl.className   = `input-status material-icons ${isValid ? 'valid' : (inputEl.value ? 'invalid' : '')}`;
  }

  const errorEl = errorElId ? document.getElementById(errorElId) : null;
  if (errorEl) {
    errorEl.textContent = (!isValid && inputEl.value.length > 0) ? message : '';
  }
}

function updatePasswordStrength(strength) {
  const bars  = document.querySelectorAll('.password-strength__bar');
  const label = document.getElementById('strengthLabel');

  bars.forEach((bar, i) => {
    bar.className = 'password-strength__bar' + (i < strength ? ` s${strength}` : '');
  });

  const labels = { 1: 'Débil', 2: 'Regular', 3: 'Buena', 4: 'Muy fuerte' };
  if (label) {
    label.textContent = strength ? labels[strength] : '';
    label.className   = `password-strength__label${strength ? ' s' + strength : ''}`;
  }
}

// Validators — each returns { valid: boolean, message: string }
function validateEmail(value) {
  if (!value) return { valid: false, message: 'El correo es obligatorio' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(value)) return { valid: false, message: 'Introduce un correo electrónico válido' };
  return { valid: true, message: '' };
}

function validateLoginPassword(value) {
  if (!value) return { valid: false, message: 'La contraseña es obligatoria' };
  if (value.length < 6) return { valid: false, message: 'Mínimo 6 caracteres' };
  return { valid: true, message: '' };
}

function validateName(value, label) {
  if (!value.trim()) return { valid: false, message: `El ${label} es obligatorio` };
  if (value.trim().length < 2) return { valid: false, message: `El ${label} debe tener al menos 2 caracteres` };
  const re = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  if (!re.test(value.trim())) return { valid: false, message: `El ${label} solo puede contener letras` };
  return { valid: true, message: '' };
}

function validatePhone(value) {
  if (!value.trim()) return { valid: true, message: '' }; // optional
  const re = /^[+]?[\d\s\-]{9,15}$/;
  if (!re.test(value.trim())) return { valid: false, message: 'Formato de teléfono no válido' };
  return { valid: true, message: '' };
}

function validatePassword(value) {
  if (!value) return { valid: false, message: 'La contraseña es obligatoria', strength: 0 };
  if (value.length < 8) return { valid: false, message: 'Mínimo 8 caracteres', strength: 1 };

  const hasUpper   = /[A-Z]/.test(value);
  const hasNumber  = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value);

  let strength = 2;
  if (hasUpper && hasNumber)             strength = 3;
  if (hasUpper && hasNumber && hasSpecial) strength = 4;

  if (!hasUpper)   return { valid: false, message: 'Debe incluir al menos una letra mayúscula', strength };
  if (!hasNumber)  return { valid: false, message: 'Debe incluir al menos un número', strength };

  return { valid: true, message: '', strength };
}

function validatePasswordConfirm(value, original) {
  if (!value) return { valid: false, message: 'Confirma tu contraseña' };
  if (value !== original) return { valid: false, message: 'Las contraseñas no coinciden' };
  return { valid: true, message: '' };
}

function validateLoginForm() {
  const email = document.getElementById('loginEmail');
  const pass  = document.getElementById('loginPassword');
  if (!email || !pass) return false;

  const emailR = validateEmail(email.value);
  const passR  = validateLoginPassword(pass.value);

  setFieldState(email, 'loginEmailStatus', 'loginEmailError', emailR.valid, emailR.message);
  setFieldState(pass,  null, 'loginPasswordError', passR.valid, passR.message);

  return emailR.valid && passR.valid;
}

function validateRegisterForm() {
  const firstName = document.getElementById('firstName');
  const lastName  = document.getElementById('lastName');
  const email     = document.getElementById('registerEmail');
  const phone     = document.getElementById('phone');
  const password  = document.getElementById('registerPassword');
  const confirm   = document.getElementById('confirmPassword');
  const terms     = document.getElementById('acceptTerms');
  const termsErr  = document.getElementById('termsError');

  const r1 = validateName(firstName?.value || '', 'nombre');
  const r2 = validateName(lastName?.value  || '', 'apellido');
  const r3 = validateEmail(email?.value    || '');
  const r4 = validatePhone(phone?.value    || '');
  const r5 = validatePassword(password?.value || '');
  const r6 = validatePasswordConfirm(confirm?.value || '', password?.value || '');
  const termsOk = terms?.checked;

  setFieldState(firstName, 'firstNameStatus', 'firstNameError', r1.valid, r1.message);
  setFieldState(lastName,  'lastNameStatus',  'lastNameError',  r2.valid, r2.message);
  setFieldState(email,     'registerEmailStatus', 'registerEmailError', r3.valid, r3.message);
  setFieldState(phone,     'phoneStatus', 'phoneError', r4.valid, r4.message);
  setFieldState(password,  null, 'registerPasswordError', r5.valid, r5.message);
  setFieldState(confirm,   null, 'confirmPasswordError',  r6.valid, r6.message);

  if (termsErr) termsErr.textContent = termsOk ? '' : 'Debes aceptar los términos y condiciones';

  updatePasswordStrength(r5.strength);

  return r1.valid && r2.valid && r3.valid && r4.valid && r5.valid && r6.valid && termsOk;
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  
  // 1. Validar formato (cliente) antes de enviar al servidor
  if (!validateLoginForm()) return;

  // 2. Capturar datos de los inputs
  const correo = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe')?.checked;

  try {
    // 3. Petición real al Backend
    const response = await fetch('http://localhost:5000/api/usuarios/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correo, password })
    });

    const data = await response.json();

    // 4. Manejo de la respuesta basada en tu controlador
    if (response.status === 200) {
      // Éxito: El backend devuelve { mensaje, usuario: { id, nombre, rol } }
      state.currentUser = data.usuario;
      
      // Si el usuario marcó "Recordarme", guardamos en storage local
      if (remember) {
        saveUserToStorage(data.usuario);
      }

      updateAuthUI();
      showAuthSuccess('login', data.usuario.nombre);
      
    } else if (response.status === 401) {
      // Error: "Correo o contraseña incorrectos"
      showToast(data.mensaje, 'warning');
    } else {
      // Otros errores (500, etc.)
      showToast(data.mensaje || 'Error en el inicio de sesión', 'error');
    }

  } catch (error) {
    // Si el servidor está apagado o no hay internet
    console.error('Error de red:', error);
    showToast('Usuario o contraseña incorrectos', 'error');
  }
}

//Registro del back y front
async function handleRegisterSubmit(e) {
  e.preventDefault();
  if (!validateRegisterForm()) return;

  const nombreCompleto = `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`;

  const newUser = {
    nombre: nombreCompleto,
    correo: document.getElementById('registerEmail').value.trim(),
    password: document.getElementById('registerPassword').value,
    rol: 'cliente' 
  };

  try {
    const response = await fetch('http://localhost:5000/api/usuarios', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });

    const data = await response.json();

    if (response.status === 201 || response.status === 200) {
      state.currentUser = data; 
      saveUserToStorage(data);
      updateAuthUI(); 
      showAuthSuccess('register', data.nombre);
    } else {
      showToast(data.mensaje || 'Error al registrar', 'error');
    }
  } catch (error) {
    console.error('Error en fetch registro:', error);
    showToast('Error de conexión con el servidor', 'error');
  }
}

const phoneInput = document.getElementById('phone');

if (phoneInput) {
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    value = value.substring(0, 8);
    
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4);
    }
    
    e.target.value = value;

    const statusIcon = document.getElementById('phoneStatus');
    if (value.length === 9) {
       setFieldState('phone', 'success');
    } else if (value.length > 0) {
       setFieldState('phone', 'error', 'El formato debe ser 0000-0000');
    } else {
       setFieldState('phone', 'default');
    }
  });
}

function showAuthSuccess(type, name) {
  const successEl  = document.getElementById('authSuccess');
  const titleEl    = document.getElementById('successTitle');
  const messageEl  = document.getElementById('successMessage');
  const loginPanel = document.getElementById('loginPanel');
  const regPanel   = document.getElementById('registerPanel');

  if (!successEl) return;

  if (loginPanel) loginPanel.classList.remove('active');
  if (regPanel)   regPanel.classList.remove('active');

  if (titleEl) {
    titleEl.textContent = type === 'login'
      ? `¡Bienvenido de vuelta, ${name}!`
      : `¡Cuenta creada, ${name}!`;
  }
  if (messageEl) {
    messageEl.textContent = type === 'login'
      ? 'Has iniciado sesión correctamente.'
      : 'Tu cuenta ha sido creada. Ya puedes disfrutar de todos los beneficios.';
  }

  successEl.style.display = 'flex';
  showToast(
    type === 'login' ? 'Sesión iniciada correctamente' : '¡Cuenta creada con éxito!',
    'success'
  );
}

// ============================================================
// 15. HERO CAROUSEL
// ============================================================

function initializeHero() {
  const slides     = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.indicator');
  if (!slides.length || !indicators.length) return;

  let currentSlide = 0;
  let autoPlayTimer;

  const setActive = index => {
    slides.forEach(s => s.classList.remove('active'));
    indicators.forEach(i => i.classList.remove('active'));
    slides[index].classList.add('active');
    indicators[index].classList.add('active');
    currentSlide = index;
  };

  const next = () => setActive((currentSlide + 1) % slides.length);
  const startAuto = () => { autoPlayTimer = setInterval(next, CONFIG.SLIDE_INTERVAL); };
  const stopAuto  = () => clearInterval(autoPlayTimer);

  indicators.forEach((ind, i) => {
    ind.addEventListener('click', () => { setActive(i); stopAuto(); startAuto(); });
  });

  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.addEventListener('mouseenter', stopAuto);
    heroSection.addEventListener('mouseleave', startAuto);
  }

  // Touch swipe support
  let touchStartX = 0;
  if (heroSection) {
    heroSection.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    heroSection.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        setActive(diff > 0
          ? (currentSlide + 1) % slides.length
          : (currentSlide - 1 + slides.length) % slides.length
        );
        stopAuto(); startAuto();
      }
    });
  }

  startAuto();
}

// ============================================================
// 16. PRODUCT GALLERY (detail page)
// ============================================================

function initializeProductGallery() {
  const thumbs  = document.querySelectorAll('.thumb');
  const images  = document.querySelectorAll('.gallery-image');
  if (!thumbs.length || !images.length) return;

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      images.forEach(img => img.classList.remove('active'));
      thumb.classList.add('active');
      images[i]?.classList.add('active');
    });
  });
}

// ============================================================
// 17. PRODUCT TABS (detail page)
// ============================================================

function initializeTabs() {
  const tabBtns  = document.querySelectorAll('.tab-btn');
  const tabPanels= document.querySelectorAll('.tab-panel');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });
}

// ============================================================
// 18. QUANTITY SELECTOR (detail page)
// ============================================================

function initializeQuantitySelector() {
  const input   = document.getElementById('quantity');
  const minusBtn= document.getElementById('qtyMinus');
  const plusBtn = document.getElementById('qtyPlus');
  if (!input) return;

  minusBtn?.addEventListener('click', () => {
    const val = parseInt(input.value, 10);
    if (val > (parseInt(input.min, 10) || 1)) input.value = val - 1;
  });

  plusBtn?.addEventListener('click', () => {
    const val = parseInt(input.value, 10);
    if (val < (parseInt(input.max, 10) || 10)) input.value = val + 1;
  });
}

// ============================================================
// 19. ADD TO CART (detail page)
// ============================================================

function initializeAddToCart() {
  const addToCartBtn = document.getElementById('addToCart');
  if (!addToCartBtn) return;

  addToCartBtn.addEventListener('click', () => {
    const productDetails = document.querySelector('.product-details');
    const productId = productDetails?.getAttribute('data-product-id');
    if (!productId) return;

    const quantity     = parseInt(document.getElementById('quantity')?.value || '1', 10);
    const colorOption  = document.querySelector('.color-option.active');
    const color        = colorOption?.querySelector('.color-name')?.textContent || '';

    addToCartById(productId, quantity, color);
  });
}

// ============================================================
// 20. MOBILE MENU
// ============================================================

function createMobileOverlay() {
  if (document.getElementById('mobileOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'mobile-overlay';
  overlay.id = 'mobileOverlay';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', closeMobileMenus);
}

function closeMobileMenus() {
  const navMenu      = document.querySelector('.nav-menu');
  const filtersSidebar = document.getElementById('filtersSidebar');
  const overlay      = document.getElementById('mobileOverlay');
  const menuToggle   = document.querySelector('.mobile-menu-toggle');

  navMenu?.classList.remove('active');
  filtersSidebar?.classList.remove('active');
  overlay?.classList.remove('active');
  document.body.style.overflow = '';

  const icon = menuToggle?.querySelector('.material-icons');
  if (icon) icon.textContent = 'menu';
}

function initializeMobileMenu() {
  const toggle  = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const overlay = document.getElementById('mobileOverlay');
  if (!toggle || !navMenu) return;

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    const isActive = navMenu.classList.toggle('active');
    overlay?.classList.toggle('active', isActive);
    document.body.style.overflow = isActive ? 'hidden' : '';
    const icon = toggle.querySelector('.material-icons');
    if (icon) icon.textContent = isActive ? 'close' : 'menu';
    toggle.setAttribute('aria-expanded', String(isActive));
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenus);
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768) closeMobileMenus();
    }, 200);
  });
}

// ============================================================
// 21. NEWSLETTER
// ============================================================

function initializeNewsletterForm() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]');
      if (!email?.value) return;
      showToast('¡Gracias por suscribirte!', 'success');
      form.reset();
    });
  });
}

// ============================================================
// 22. WISHLIST (header button + product card buttons)
// ============================================================

function initializeWishlistBtn() {
  // Header wishlist button (not on product cards — handled via event delegation in renderProducts)
  document.getElementById('wishlistBtn')?.addEventListener('click', () => {
    showToast('Lista de deseos disponible próximamente', 'info');
  });
}

// ============================================================
// 23. SCROLL-TO-TOP
// ============================================================

function initializeScrollToTop() {
  const btn = document.createElement('button');
  btn.innerHTML = '<span class="material-icons" aria-hidden="true">arrow_upward</span>';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.className = 'scroll-to-top-btn';
  btn.style.cssText = `
    position: fixed; bottom: 30px; right: 30px;
    width: 48px; height: 48px;
    background: var(--primary-color); color: var(--text-primary);
    border: none; border-radius: 50%; display: none;
    align-items: center; justify-content: center;
    cursor: pointer; z-index: 999;
    box-shadow: var(--shadow-md);
    transition: all var(--transition-base);`;

  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
}

// ============================================================
// 24. LAZY LOADING
// ============================================================

function initializeLazyLoading() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

// ============================================================
// 25. KEYBOARD ACCESSIBILITY
// ============================================================

function initializeKeyboardSupport() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileMenus();
  });
}

// ============================================================
// 26. SMOOTH SCROLL
// ============================================================

function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '#!') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ============================================================
// 27. PRODUCT CARD HOVER (visual enhancement via CSS is preferred,
//     but keeping for compatibility with existing styles)
// ============================================================

function initializeProductCardHover() {
  // CSS handles hover — JS only needed for browsers without :hover on touch
  // Intentionally minimal to avoid duplicating CSS transitions
}

// ============================================================
// 28. SINGLE DOMContentLoaded ENTRY POINT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // --- Bootstrap dependency check ---
  if (typeof bootstrap === 'undefined') {
    console.warn('[Teknovation] Bootstrap JS not loaded — drawer/modal/toast require it.');
  }

  // --- Persistent state ---
  loadCartFromStorage();
  loadUserFromStorage();

  // --- Inject global UI elements ---
  createMobileOverlay();
  createToastContainer();
  createCartDrawer();
  createSearchModal();

  // --- Load products (needed by search and pages) ---
  await loadProductsData();

  // --- Update UI from state ---
  updateCartCount();
  renderCartDrawer();
  updateAuthUI();

  // --- Universal initializations (all pages) ---
  initializeMobileMenu();
  initializeSearch();
  initializeNewsletterForm();
  initializeWishlistBtn();
  initializeSmoothScroll();
  initializeScrollToTop();
  initializeLazyLoading();
  initializeKeyboardSupport();

  // --- Conditional initializations by page ---
  if (document.querySelector('.hero'))             initializeHero();
  if (document.querySelector('.filters-sidebar'))  initializeFilters();
  if (document.querySelector('.product-gallery'))  initializeProductGallery();
  if (document.querySelector('.tabs'))             initializeTabs();
  if (document.getElementById('qtyMinus'))         initializeQuantitySelector();
  if (document.getElementById('addToCart'))        initializeAddToCart();

  if (isPage('product.html')) initializeProductPage();
  if (isPage('shop.html'))    initializeShopPage();
  if (isPage('cart.html'))    initializeCartPage();
  if (isPage('auth.html'))    initializeAuthPage();
});

// ============================================================
// Developer console branding
// ============================================================
console.log(
  '%c TEKNOVATION %c Gaming Store v2.0 ',
  'background:#00b8db;color:#111;font-weight:900;padding:4px 8px;border-radius:4px 0 0 4px;font-size:12px',
  'background:#111;color:#00b8db;font-weight:600;padding:4px 8px;border-radius:0 4px 4px 0;font-size:12px'
);
