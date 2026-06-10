// ===========================
// Global State
// ===========================
let cart = [];
let cartCount = 0;
let productsData = null;

// ===========================
// DOM Ready
// ===========================
// ===========================
// DOM Ready
// ===========================
document.addEventListener('DOMContentLoaded', async function() {
    // Inicialización de Interfaz
    createMobileOverlay();
    
    // CARGA DE DATOS: Esperamos a que los productos carguen antes de seguir
    await loadProductsData();
    
    // Inicialización de componentes visuales
    initializeHero();
    initializeFilters();
    initializeProductGallery();
    initializeTabs();
    initializeQuantitySelector();
    initializeMobileMenu();
    initializeNewsletterForm();
    
    // CARGA DE ESTADO: Recuperamos el carrito guardado
    loadCartFromStorage();
    
    // INTEGRACIÓN: Activamos las alertas de Mi Cuenta y Carrito con SweetAlert2
    setupAuthAndCartEvents(); 

    // Páginas dinámicas específicas
    if (window.location.pathname.includes('product.html')) {
        initializeProductPage();
    }
    
    if (window.location.pathname.includes('shop.html')) {
        initializeShopPage();
    }
});

// ===========================
// MODALES DE AUTENTICACIÓN
// ===========================

function showLoginModal() {
    Swal.fire({
        title: 'Iniciar Sesión',
        html: `
            <input type="email" id="swal-email" class="swal2-input" placeholder="Correo electrónico">
            <input type="password" id="swal-pass" class="swal2-input" placeholder="Contraseña">
        `,
        focusConfirm: false,
        confirmButtonText: 'Entrar',
        confirmButtonColor: '#00b8db', // Color celeste de Teknovation
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const email = document.getElementById('swal-email').value;
            const pass = document.getElementById('swal-pass').value;

            // VALIDACIONES DE INICIO
            if (!email.includes('@')) {
                Swal.showValidationMessage('Error: El correo debe incluir un @');
                return false;
            }
            if (pass.length < 8) {
                Swal.showValidationMessage('Error: La contraseña debe tener al menos 8 dígitos');
                return false;
            }
            return { email: email };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // LÓGICA DE ROLES
            const emailLower = result.value.email.toLowerCase();
            const isAdmin = emailLower.startsWith('admin@');
            const role = isAdmin ? 'Administrador' : 'Cliente';

            Swal.fire({
                title: '¡Sesión Iniciada!',
                html: `Bienvenido. Has entrado con el rol de: <b>${role}</b>`,
                icon: 'success',
                confirmButtonColor: '#00b8db'
            });
        }
    });
}

function showRegisterModal() {
    Swal.fire({
        title: 'Crear Cuenta',
        html: `
            <input type="text" id="swal-fullname" class="swal2-input" placeholder="Nombre y 2 apellidos">
            <input type="email" id="swal-reg-email" class="swal2-input" placeholder="Correo electrónico">
            <input type="password" id="swal-reg-pass" class="swal2-input" placeholder="Contraseña (min 8)">
        `,
        focusConfirm: false,
        confirmButtonText: 'Registrarse',
        confirmButtonColor: '#9945ff', // Color morado de registro
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const name = document.getElementById('swal-fullname').value.trim();
            const email = document.getElementById('swal-reg-email').value;
            const pass = document.getElementById('swal-reg-pass').value;

            // VALIDACIÓN DE NOMBRE (Mínimo 3 palabras)
            const words = name.split(/\s+/);
            if (words.length < 3) {
                Swal.showValidationMessage('Error: Ingresa nombre completo (Nombre + 2 Apellidos)');
                return false;
            }
            // VALIDACIÓN DE CORREO Y CLAVE
            if (!email.includes('@')) {
                Swal.showValidationMessage('Error: Correo electrónico inválido');
                return false;
            }
            if (pass.length < 8) {
                Swal.showValidationMessage('Error: La contraseña debe ser de 8 o más caracteres');
                return false;
            }
            return { firstName: words[0] }; // Retornamos solo el primer nombre
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Saludo personalizado con el primer nombre
            Swal.fire({
                title: '¡Registro Exitoso!',
                text: `Hola ${result.value.firstName}, tu cuenta ha sido creada correctamente.`,
                icon: 'success',
                confirmButtonColor: '#9945ff'
            });
        }
    });
}

// ===========================
// Create Mobile Overlay
// ===========================
function createMobileOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobileOverlay';
    document.body.appendChild(overlay);
    
    // Close menu/filters when clicking overlay
    overlay.addEventListener('click', closeMobileMenus);
}

function closeMobileMenus() {
    const navMenu = document.querySelector('.nav-menu');
    const filtersSidebar = document.getElementById('filtersSidebar');
    const overlay = document.getElementById('mobileOverlay');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu) {
        navMenu.classList.remove('active');
    }
    
    if (filtersSidebar) {
        filtersSidebar.classList.remove('active');
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
    
    if (mobileMenuToggle) {
        const icon = mobileMenuToggle.querySelector('.material-icons');
        if (icon) {
            icon.textContent = 'menu';
        }
    }
}

// ===========================
// Keyboard Support
// ===========================
document.addEventListener('keydown', function(e) {
    // Close menus on ESC key
    if (e.key === 'Escape' || e.keyCode === 27) {
        closeMobileMenus();
    }
});

// ===========================
// Load Products Data
// ===========================
async function loadProductsData() {
    try {
        const response = await fetch('products.json');
        productsData = await response.json();
        return productsData;
    } catch (error) {
        console.error('Error loading products:', error);
        return null;
    }
}

// ===========================
// Dynamic Product Page
// ===========================
async function initializeProductPage() {
    // Get product ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    setupAuthAndCartEvents
    if (!productId) {
        console.warn('No product ID provided');
        return;
    }
    
    // Wait for products data to load
    if (!productsData) {
        await loadProductsData();
    }
    
    if (!productsData) {
        console.error('Failed to load products data');
        return;
    }
    
    // Find the product
    const product = productsData.products.find(p => p.id === productId);
    
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    // Update page with product data
    updateProductPage(product);
}

function updateProductPage(product) {
    // 1. Imagen Principal Dinámica
    const imgPath = `./assets/productos/${product.name}.jpg`;
    const galleryMain = document.querySelector('.gallery-main');
    
    if (galleryMain) {
        galleryMain.innerHTML = `
            <div class="gallery-image active">
                <img src="${imgPath}" alt="${product.name}" 
                     onerror="this.src='https://placehold.co/600x600?text=Mouse'"
                     style="width: 100%; height: 100%; object-fit: contain;">
            </div>
        `;
    }

    renderRelatedProducts(product.category);

    // Actualizamos las miniaturas (Thumbs)
    const thumbsContainer = document.querySelector('.gallery-thumbs');
    if (thumbsContainer) {
        thumbsContainer.innerHTML = `
            <button class="thumb active">
                <img src="${imgPath}" alt="${product.name}" 
                     style="width: 100%; height: 100%; object-fit: contain; padding: 5px;">
            </button>
        `;
    }

    // --- ACTUALIZACIÓN DE TEXTOS Y DATOS ---
    // Update breadcrumb
    const breadcrumbProduct = document.querySelector('.breadcrumb li[aria-current="page"]');
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = product.name;
    }
    
    // Update product badge
    const badgeSeries = document.querySelector('.product-badge-series');
    if (badgeSeries) {
        badgeSeries.textContent = product.series.toUpperCase() + ' Series';
    }
    
    // Update title and description
    const title = document.querySelector('.product-title');
    if (title) title.textContent = product.name;
    
    const description = document.querySelector('.product-description');
    if (description) description.textContent = product.subtitle;
    
    // Update rating
    const ratingCount = document.querySelector('.rating-count');
    if (ratingCount) {
        ratingCount.textContent = `(${product.reviewCount} reseñas)`;
    }
    
    // Update price (con reemplazo de punto por coma para formato euro)
    const priceEl = document.querySelector('.product-price-large .price-current');
    if (priceEl) {
        priceEl.textContent = `${product.price.toFixed(2)} €`.replace('.', ',');
    }
    
    // Update colors
    const colorOptions = document.querySelector('.color-options');
    if (colorOptions && product.colors) {
        colorOptions.innerHTML = product.colors.map((color, index) => `
            <button class="color-option ${index === 0 ? 'active' : ''}" data-color="${color.toLowerCase()}" aria-label="${color}">
                <span class="color-swatch" style="background: ${getColorHex(color)}; ${color === 'Blanco' ? 'border: 1px solid #ddd;' : ''}"></span>
                <span class="color-name">${color}</span>
            </button>
        `).join('');
        
        // Re-vincular eventos de selección de color
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // Update stock status
    const addToCartBtn = document.getElementById('addToCart');
    if (!product.inStock && addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<span class="material-icons">info</span> Agotado temporalmente';
        addToCartBtn.style.opacity = '0.6';
        addToCartBtn.style.cursor = 'not-allowed';
    }
    
    // Update tabs (Description & Specs)
    const descriptionTab = document.getElementById('description');
    if (descriptionTab && product.features_list) {
        descriptionTab.innerHTML = `
            <h2>Descripción del Producto</h2>
            <p>${product.description}</p>
            <h3>Características Principales:</h3>
            <ul>${product.features_list.map(f => `<li>${f}</li>`).join('')}</ul>
        `;
    }
    
    const specsTab = document.getElementById('specs');
    if (specsTab && product.specifications) {
        specsTab.innerHTML = `
            <h2>Especificaciones Técnicas</h2>
            <div class="specs-grid">
                ${Object.entries(product.specifications).map(([key, value]) => `
                    <div class="spec-item">
                        <h4>${formatSpecKey(key)}</h4>
                        <p>${value}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Guardar ID en el contenedor para el carrito
    document.querySelector('.product-details')?.setAttribute('data-product-id', product.id);
}

function getColorHex(colorName) {
    const colors = {
        'Negro': '#000000',
        'Blanco': '#ffffff',
        'Rosa': '#ff69b4',
        'Azul': '#1e90ff',
        'Lila': '#9370db',
        'Rojo': '#dc143c',
        'Verde': '#32cd32'
    };
    return colors[colorName] || '#000000';
}

function formatSpecKey(key) {
    const keyMap = {
        'sensor': 'Sensor',
        'connectivity': 'Conectividad',
        'responseRate': 'Velocidad de Respuesta',
        'weight': 'Peso',
        'battery': 'Batería',
        'buttons': 'Botones Programables',
        'dimensions': 'Dimensiones',
        'compatibility': 'Compatible con'
    };
    return keyMap[key] || key;
}

// ===========================
// Dynamic Shop Page
// ===========================
async function initializeShopPage() {
    // Wait for products data to load
    if (!productsData) {
        await loadProductsData();
    }
    
    if (!productsData) {
        console.error('Failed to load products data');
        return;
    }
    
    renderProducts(productsData.products);
}

function renderProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = products.map(product => {
        const imgPath = `./assets/productos/${product.name}.jpg`;
        // Verificamos si ya es favorito para pintar el corazón
        const isFav = favorites.some(p => p.id === product.id);
        
        return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" class="product-link">
                ${product.isNew ? '<div class="product-badge">Nuevo</div>' : ''}
                <div class="product-image">
                    <img src="${imgPath}" alt="${product.name}" 
                         onerror="this.src='https://placehold.co/300x300?text=Mouse'"
                         style="width: 100%; height: 100%; object-fit: contain;">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        <span class="price-current">${product.price.toFixed(2)} €</span>
                    </div>
                </div>
            </a>
            <div class="product-actions" style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
                ${product.inStock ? `
                    <button class="btn btn-primary btn-add-cart" onclick="addToCartById('${product.id}')" style="flex: 1;">
                        <span class="material-icons">shopping_cart</span>
                        Añadir al carrito
                    </button>
                ` : `
                    <button class="btn btn-secondary" disabled style="flex: 1; opacity: 0.6; cursor: not-allowed;">
                        <span class="material-icons">block</span>
                        Agotado
                    </button>
                `}
                
                <button class="btn-icon favorite-btn" 
                        onclick="toggleFavorite('${product.id}', this)" 
                        style="min-width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border: 1px solid #eee; border-radius: 8px; cursor: pointer;">
                    <span class="material-icons" style="${isFav ? 'color: #ff3d00;' : ''}">
                        ${isFav ? 'favorite' : 'favorite_border'}
                    </span>
                </button>
            </div>
        </div>
    `}).join('');

    

    
    // Update product count
    const productCountEl = document.getElementById('productCount');
    if (productCountEl) {
        productCountEl.textContent = products.length;
    }
    
    // Re-attach event listeners for add to cart buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            addToCartById(productId);
        });
    });
}

function addToCartById(productId) {
    if (!productsData) return;
    
    const product = productsData.products.find(p => p.id === productId);
    if (!product) return;
    
    const cartItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        color: product.colors[0]
    };
    
    cart.push(cartItem);
    cartCount += 1;
    
    saveCartToStorage();
    updateCartCount();
    showAddToCartNotification(product.name);
}

// ===========================
// Hero Carousel
// ===========================
function initializeHero() {
    const indicators = document.querySelectorAll('.indicator');
    const slides = document.querySelectorAll('.hero-slide');
    
    if (!indicators.length || !slides.length) return;
    
    let currentSlide = 0;
    let autoPlayInterval;
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            setActiveSlide(index);
            resetAutoPlay();
        });
    });
    
    function setActiveSlide(index) {
        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(ind => ind.classList.remove('active'));
        
        // Add active class to current
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
        currentSlide = index;
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        setActiveSlide(currentSlide);
    }
    
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }
    
    // Start auto-play
    startAutoPlay();
    
    // Pause on hover
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', () => {
            clearInterval(autoPlayInterval);
        });
        
        heroSection.addEventListener('mouseleave', () => {
            startAutoPlay();
        });
    }
}

// ===========================
// Shop Filters
// ===========================
function initializeFilters() {
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const mobileFiltersBtn = document.getElementById('mobileFiltersBtn');
    const closeFiltersBtn = document.getElementById('closeFilters');
    const filtersSidebar = document.getElementById('filtersSidebar');
    const filterCheckboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    const sortSelect = document.getElementById('sortSelect');
    const clearFiltersBtn = document.querySelector('.btn-clear-filters');
    const overlay = document.getElementById('mobileOverlay');
    
    if (!filtersSidebar) return;
    
    // Toggle filters sidebar (mobile)
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', () => {
            filtersSidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Mobile filters button
    if (mobileFiltersBtn) {
        mobileFiltersBtn.addEventListener('click', () => {
            filtersSidebar.classList.add('active');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeFiltersBtn) {
        closeFiltersBtn.addEventListener('click', () => {
            filtersSidebar.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Filter products
    if (filterCheckboxes.length) {
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', filterProducts);
        });
    }
    
    // Sort products
    if (sortSelect) {
        sortSelect.addEventListener('change', sortProducts);
    }
    
    // Clear filters
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            filterCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            filterProducts();
        });
    }
}

function filterProducts() {
    const products = document.querySelectorAll('.product-card');
    const activeFilters = {
        connectivity: [],
        series: [],
        price: [],
        features: []
    };
    
    // Collect active filters
    document.querySelectorAll('.filter-option input[type="checkbox"]:checked').forEach(checkbox => {
        const filterType = checkbox.name;
        const filterValue = checkbox.value;
        if (activeFilters[filterType]) {
            activeFilters[filterType].push(filterValue);
        }
    });
    
    // Filter products
    let visibleCount = 0;
    products.forEach(product => {
        let shouldShow = true;
        
        // Check connectivity
        if (activeFilters.connectivity.length > 0) {
            const connectivity = product.dataset.connectivity;
            if (!activeFilters.connectivity.includes(connectivity)) {
                shouldShow = false;
            }
        }
        
        // Check series
        if (activeFilters.series.length > 0) {
            const series = product.dataset.series;
            if (!activeFilters.series.includes(series)) {
                shouldShow = false;
            }
        }
        
        // Check price
        if (activeFilters.price.length > 0) {
            const price = parseFloat(product.dataset.price);
            let priceMatch = false;
            
            activeFilters.price.forEach(range => {
                if (range === '0-50' && price < 50) priceMatch = true;
                if (range === '50-100' && price >= 50 && price < 100) priceMatch = true;
                if (range === '100-150' && price >= 100 && price < 150) priceMatch = true;
                if (range === '150+' && price >= 150) priceMatch = true;
            });
            
            if (!priceMatch) {
                shouldShow = false;
            }
        }
        
        // Show or hide product
        if (shouldShow) {
            product.style.display = '';
            visibleCount++;
        } else {
            product.style.display = 'none';
        }
    });
    
    // Update product count
    const productCountEl = document.getElementById('productCount');
    if (productCountEl) {
        productCountEl.textContent = visibleCount;
    }
}

function sortProducts() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    
    const sortValue = sortSelect.value;
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    const products = Array.from(productsGrid.querySelectorAll('.product-card'));
    
    products.sort((a, b) => {
        switch(sortValue) {
            case 'price-asc':
                return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
            case 'price-desc':
                return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
            case 'name':
                const nameA = a.querySelector('.product-name').textContent;
                const nameB = b.querySelector('.product-name').textContent;
                return nameA.localeCompare(nameB);
            default:
                return 0;
        }
    });
    
    // Re-append sorted products
    products.forEach(product => {
        productsGrid.appendChild(product);
    });
}

// ===========================
// Product Gallery
// ===========================
function initializeProductGallery() {
    const thumbs = document.querySelectorAll('.thumb');
    const galleryImages = document.querySelectorAll('.gallery-image');
    
    if (!thumbs.length || !galleryImages.length) return;
    
    thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
            // Remove active from all
            thumbs.forEach(t => t.classList.remove('active'));
            galleryImages.forEach(img => img.classList.remove('active'));
            
            // Add active to clicked
            thumb.classList.add('active');
            galleryImages[index].classList.add('active');
        });
    });
}

// ===========================
// Product Tabs
// ===========================
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    if (!tabBtns.length || !tabPanels.length) return;
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
        });
    });
}

// ===========================
// Quantity Selector
// ===========================
function initializeQuantitySelector() {
    const qtyMinusBtn = document.getElementById('qtyMinus');
    const qtyPlusBtn = document.getElementById('qtyPlus');
    const qtyInput = document.getElementById('quantity');
    
    if (!qtyInput) return;
    
    if (qtyMinusBtn) {
        qtyMinusBtn.addEventListener('click', () => {
            const currentValue = parseInt(qtyInput.value);
            const minValue = parseInt(qtyInput.min) || 1;
            if (currentValue > minValue) {
                qtyInput.value = currentValue - 1;
            }
        });
    }
    
    if (qtyPlusBtn) {
        qtyPlusBtn.addEventListener('click', () => {
            const currentValue = parseInt(qtyInput.value);
            const maxValue = parseInt(qtyInput.max) || 10;
            if (currentValue < maxValue) {
                qtyInput.value = currentValue + 1;
            }
        });
    }
}

// ===========================
// Cart Functionality
// ===========================
function initializeCart() {
    // Add to cart from product page
    const addToCartBtn = document.getElementById('addToCart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
    
    // Add to cart from product cards
    const addToCartBtns = document.querySelectorAll('.btn-add-cart');
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCartFromCard(this);
        });
    });
    
    // Update cart count display
    updateCartCount();
}

function handleAddToCart() {
    const productDetails = document.querySelector('.product-details');
    const productId = productDetails?.getAttribute('data-product-id');
    
    // If we have product ID and data, use that
    if (productId && productsData) {
        const product = productsData.products.find(p => p.id === productId);
        if (product) {
            const quantity = parseInt(document.getElementById('quantity')?.value || 1);
            const colorOption = document.querySelector('.color-option.active');
            const color = colorOption?.querySelector('.color-name')?.textContent || product.colors[0];
            
            const cartItem = {
                id: Date.now(),
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                color: color
            };
            
            cart.push(cartItem);
            cartCount += quantity;
            
            saveCartToStorage();
            updateCartCount();
            showAddToCartNotification(product.name);
            return;
        }
    }
    
    // Fallback to legacy method
    const productTitle = document.querySelector('.product-title')?.textContent || 'Producto';
    const priceText = document.querySelector('.product-price-large .price-current')?.textContent || '0';
    const price = parseFloat(priceText.replace('€', '').replace(',', '.').trim());
    const quantity = parseInt(document.getElementById('quantity')?.value || 1);
    const color = document.querySelector('.color-option.active .color-name')?.textContent || 'Negro';
    
    const product = {
        id: Date.now(),
        name: productTitle,
        price: price,
        quantity: quantity,
        color: color
    };
    
    cart.push(product);
    cartCount += quantity;
    
    saveCartToStorage();
    updateCartCount();
    showAddToCartNotification(productTitle);
}

function handleAddToCartFromCard(button) {
    // Check if button has product ID
    const productId = button.getAttribute('data-product-id');
    
    if (productId && productsData) {
        addToCartById(productId);
        return;
    }
    
    // Fallback to legacy method
    const card = button.closest('.product-card');
    const productName = card.querySelector('.product-name')?.textContent || 'Producto';
    const priceText = card.querySelector('.price-current')?.textContent || '0';
    const price = parseFloat(priceText.replace('€', '').replace(',', '.').trim());
    
    const product = {
        id: Date.now(),
        name: productName,
        price: price,
        quantity: 1,
        color: 'Negro'
    };
    
    cart.push(product);
    cartCount += 1;
    
    saveCartToStorage();
    updateCartCount();
    showAddToCartNotification(productName);
}

function updateCartCount() {
    const cartCountEls = document.querySelectorAll('.cart-count');
    cartCountEls.forEach(el => {
        el.textContent = cartCount;
    });
}

function showAddToCartNotification(productName) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #00d9ff;
        color: #111;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = `✓ ${productName} añadido al carrito`;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function saveCartToStorage() {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('cartCount', cartCount.toString());
    } catch (e) {
        console.error('Error saving cart to storage:', e);
    }
}

function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('cart');
        const savedCount = localStorage.getItem('cartCount');
        
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
        if (savedCount) {
            cartCount = parseInt(savedCount);
            updateCartCount();
        }
    } catch (e) {
        console.error('Error loading cart from storage:', e);
    }
}

// ===========================
// Mobile Menu
// ===========================
function initializeMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.getElementById('mobileOverlay');
    
    if (!mobileMenuToggle || !navMenu) return;
    
    mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = navMenu.classList.toggle('active');
        
        if (overlay) {
            overlay.classList.toggle('active', isActive);
        }
        
        document.body.style.overflow = isActive ? 'hidden' : '';
        
        // Update icon
        const icon = mobileMenuToggle.querySelector('.material-icons');
        if (icon) {
            icon.textContent = isActive ? 'close' : 'menu';
        }
    });
    
    // Close menu when clicking on a link
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            
            const icon = mobileMenuToggle.querySelector('.material-icons');
            if (icon) {
                icon.textContent = 'menu';
            }
        });
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
                
                const icon = mobileMenuToggle.querySelector('.material-icons');
                if (icon) {
                    icon.textContent = 'menu';
                }
            }
        }, 250);
    });
}

// ===========================
// Newsletter Form
// ===========================
function initializeNewsletterForm() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                // Show success message
                showNotification('¡Gracias por suscribirte!', 'success');
                this.reset();
            }
        });
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#00c853' : '#00d9ff'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ===========================
// Color Selector
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const colorOptions = document.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active from all
            colorOptions.forEach(opt => opt.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
        });
    });
});

// ===========================
// Smooth Scroll for Anchor Links
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ===========================
// Search Functionality (Basic)
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const searchBtns = document.querySelectorAll('[aria-label="Buscar"]');
    
    searchBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Reemplazamos el prompt nativo por un modal moderno
            Swal.fire({
                title: '¿Qué estás buscando?',
                input: 'text',
                inputPlaceholder: 'Escribe el nombre del producto...',
                showCancelButton: true,
                confirmButtonText: 'Buscar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#9945ff', 
                cancelButtonColor: '#444',
                background: '#ffffff',
                color: '#242424',
                inputAttributes: {
                    'autocapitalize': 'off'
                },
                preConfirm: (query) => {
                    if (!query) {
                        Swal.showValidationMessage('Debes ingresar un término de búsqueda');
                    }
                    return query;
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const query = result.value.toLowerCase();
                    
                    // Simulación de carga antes de mostrar resultados
                    Swal.fire({
                        title: 'Buscando...',
                        html: `Localizando: <b>${query}</b>`,
                        timer: 1500,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        background: '#1a1a1a',
                        color: '#fff',
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    }).then(() => {
                        // Aquí podrías filtrar tus productos o redirigir:
                        console.log('Searching for:', query);
                        // window.location.href = `shop.html?search=${query}`;
                    });
                }
            });
        });
    });
});

// ===========================
// Wishlist Functionality (Sincronizada)
// ===========================

// Variable para que los favoritos no se borren al recargar
let favorites = JSON.parse(localStorage.getItem('teknovation_favs')) || [];

document.addEventListener('DOMContentLoaded', function() {
    // Vincular el corazón del menú superior
    const navFavBtn = document.querySelector('[aria-label="Favoritos"]');
    if (navFavBtn) {
        navFavBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showFavoritesModal();
        });
    }
});

// Función para abrir el modal con el mensaje dinámico
function showFavoritesModal() {
    let html = '';
    
    if (favorites.length === 0) {
        // Mensaje de bienvenida cuando la lista está vacía
        html = `
            <div style="padding: 20px; text-align: center;">
                <span class="material-icons" style="font-size: 50px; color: #ccc; margin-bottom: 15px;">favorite_border</span>
                <p style="font-size: 1.1rem; color: #555; margin-bottom: 10px; font-weight: 600;">Aquí estarán tus productos favoritos</p>
                <p style="font-size: 0.9rem; color: #888;">Explora la tienda y toca el corazón para guardar lo que más te guste.</p>
            </div>`;
    } else {
        html = `<div style="max-height: 350px; overflow-y: auto;">`;
        favorites.forEach((item, index) => {
            const imgPath = `./assets/productos/${item.name}.jpg`;
            html += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${imgPath}" onerror="this.src='https://placehold.co/50x50?text=Mouse'" 
                             style="width: 50px; height: 50px; object-fit: contain; background: #f9f9f9; border-radius: 8px;">
                        <div style="text-align: left;">
                            <div style="font-weight: 700; font-size: 0.9rem;">${item.name}</div>
                            <div style="color: #9945ff; font-weight: 800;">${item.price.toFixed(2)} €</div>
                        </div>
                    </div>
                    <button onclick="removeFavoriteFromModal(${index})" style="background: none; border: none; color: #ff3d00; cursor: pointer;">
                        <span class="material-icons">delete_outline</span>
                    </button>
                </div>`;
        });
        html += `</div>`;
    }

    Swal.fire({
        title: 'Mis Favoritos ❤️',
        html: html,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#9945ff', // Morado institucional
        showCloseButton: true
    });
}

// Función global para manejar el clic en los corazones de la tienda
window.toggleFavorite = function(productId, button) {
    const product = productsData.products.find(p => p.id === productId);
    const index = favorites.findIndex(p => p.id === productId);
    const icon = button.querySelector('.material-icons');

    if (index > -1) {
        // Si ya es favorito, lo quitamos
        favorites.splice(index, 1);
        icon.textContent = 'favorite_border';
        icon.style.color = '';
        showNotification('Eliminado de favoritos', 'info');
    } else {
        // Si no es favorito, lo agregamos
        favorites.push(product);
        icon.textContent = 'favorite';
        icon.style.color = '#ff3d00'; // Rojo vibrante
        showNotification('¡Añadido a favoritos!', 'success');
    }
    localStorage.setItem('teknovation_favs', JSON.stringify(favorites));
};

// Función para eliminar desde el modal y sincronizar con la tienda
window.removeFavoriteFromModal = function(index) {
    favorites.splice(index, 1);
    localStorage.setItem('teknovation_favs', JSON.stringify(favorites));
    
    // CAMBIO CLAVE: Refrescamos la tienda para que los corazones se apaguen solos
    if (typeof renderProducts === 'function') {
        renderProducts(productsData.products);
    }
    
    showFavoritesModal(); // Recargar el modal para mostrar la lista actualizada
};


// ===========================
// Product Card Hover Effects
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
});

// ===========================
// Lazy Loading Images (Basic Implementation)
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});

// ===========================
// Scroll to Top Button
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    // Create scroll to top button
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '<span class="material-icons">arrow_upward</span>';
    scrollBtn.setAttribute('aria-label', 'Volver arriba');
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: var(--primary-color);
        color: var(--text-primary);
        border: none;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(scrollBtn);
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // Scroll to top on click
    scrollBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    scrollBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    scrollBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// ==========================================
// INTEGRACIÓN: Configurar eventos de Cuenta y Carrito
// ==========================================
function setupAuthAndCartEvents() {
    // 1. Modal de acceso (Cuenta)
    document.querySelector('[aria-label="Mi cuenta"]')?.addEventListener('click', () => {
        Swal.fire({
            title: 'Acceso a Teknovation',
            text: '¿Deseas iniciar sesión o registrarte?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Iniciar Sesión',
            cancelButtonText: 'Registrarse',
            confirmButtonColor: '#00b8db',
            cancelButtonColor: '#9945ff'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoginModal();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                showRegisterModal();
            }
        });
    });

    // 2. Gestión del Carrito con Diseño Avanzado
    document.querySelector('.cart-btn')?.addEventListener('click', () => {
        if (cartCount === 0) {
            Swal.fire({
                title: 'Carrito vacío',
                text: 'Añade productos antes de proceder al pago.',
                icon: 'warning',
                confirmButtonColor: '#00b8db'
            });
        } else {
            renderCartModal();
        }
    });
}

// ===========================
// RENDERIZADO DEL MODAL TIPO TABLA
// ===========================
function renderCartModal() {
    let subtotal = 0;
    let tableHTML = `
    <div style="overflow-x:auto;">
        <table style="width:100%; text-align:left; border-collapse:collapse; font-family: sans-serif;">
            <thead>
                <tr style="border-bottom: 2px solid #eee; color: #666; font-size: 0.8rem; text-transform: uppercase;">
                    <th style="padding:10px;">Producto</th>
                    <th style="padding:10px;">Precio</th>
                    <th style="padding:10px; text-align:center;">Acción</th>
                </tr>
            </thead>
            <tbody>`;

// Dentro de renderCartModal, en el cart.forEach:
cart.forEach((item, index) => {
    subtotal += item.price;
    // Buscamos la imagen por nombre de producto
    const imgPath = `./assets/productos/${item.name}.jpg`;
    
    tableHTML += `
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding:10px; display:flex; align-items:center; gap:12px;">
                <img src="${imgPath}" 
                     onerror="this.src='https://placehold.co/50x50?text=Mouse'" 
                     style="width:50px; height:50px; border-radius:6px; object-fit:contain; background:#f9f9f9;">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:600; font-size:0.85rem; color:#333;">${item.name}</span>
                    <span style="font-size:0.7rem; color:#999;">SKU: ${item.productId || 'SKU-PRO'}</span>
                </div>
            </td>
            <td style="padding:10px; font-weight:700; color:#111;">${item.price.toFixed(2)} €</td>
            <td style="padding:10px; text-align:center;">
                <button onclick="removeItemFromCart(${index})" style="background:#fff0f0; border:1px solid #ff3d00; color:#ff3d00; border-radius:50%; width:28px; height:28px; cursor:pointer;">
                    <span class="material-icons" style="font-size:16px;">close</span>
                </button>
            </td>
        </tr>`;
});

    const tax = subtotal * 0.13; // IVA 13% según referencia
    const total = subtotal + tax;

    tableHTML += `
            </tbody>
        </table>
    </div>
    <div style="margin-top:20px; padding:15px; background:#f9f9f9; border-radius:10px; text-align:right;">
        <div style="color:#666; font-size:0.9rem;">Subtotal: <b>${subtotal.toFixed(2)} €</b></div>
        <div style="color:#666; font-size:0.9rem;">IVA (13%): <b>${tax.toFixed(2)} €</b></div>
        <div style="font-size:1.4rem; border-top:2px solid #00b8db; padding-top:10px; margin-top:10px; color:#111;">
            Total: <b style="color:#ff3d00;">${total.toFixed(2)} €</b>
            <div style="font-size:0.7rem; color:#999; font-weight:normal;">(impuesto incluido)</div>
        </div>
    </div>`;

    Swal.fire({
        title: 'Tu Carrito',
        html: tableHTML,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'FINALIZAR COMPRA',
        cancelButtonText: 'VACIAR TODO',
        confirmButtonColor: '#ff3d00', // Color naranja llamativo para compra
        cancelButtonColor: '#777'
    }).then((result) => {
        if (result.isConfirmed) {
            processSecurePayment();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            clearCartState();
            Swal.fire('Vaciado', 'El carrito ahora está en 0', 'info');
        }
    });
}

// ===========================
// FUNCIONALIDAD DE ELIMINAR INDIVIDUAL
// ===========================
window.removeItemFromCart = function(index) {
    cart.splice(index, 1);
    cartCount--;
    saveCartToStorage();
    updateCartCount();
    
    if (cart.length > 0) {
        renderCartModal(); // Recarga el diseño con los datos actualizados
    } else {
        Swal.close();
        Swal.fire({ icon: 'info', title: 'Carrito vacío', timer: 1000, showConfirmButton: false });
    }
};

// ===========================
// PROCESAMIENTO DE PAGO
// ===========================
function processSecurePayment() {
    Swal.fire({
        title: 'Procesando pago...',
        html: 'Estamos validando tu transacción con el banco.',
        timer: 2000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
        },
        willClose: () => {
            clearCartState();
        }
    }).then(() => {
        Swal.fire({
            title: '¡Compra completada!',
            text: 'Tu pedido en Teknovation se ha procesado con éxito.',
            icon: 'success',
            confirmButtonColor: '#00b8db'
        });
    });
}

// ===========================
// FUNCIÓN PARA REINICIAR CARRITO
// ===========================
function clearCartState() {
    cart = [];
    cartCount = 0;
    saveCartToStorage();
    updateCartCount();
}

// ===========================
// Notificaciones Toast (Para añadir productos)
// ===========================
function showNotification(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
    });

    Toast.fire({
        icon: type === 'success' ? 'success' : 'info',
        title: message
    });
}

//nav

document.addEventListener('DOMContentLoaded', () => {
    // Lógica para el botón de Ofertas (Subir al inicio)
    document.getElementById('nav-offers')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
        });
    });

    // Lógica para Soporte (Bajar al footer)
    document.getElementById('nav-support')?.addEventListener('click', (e) => {
        e.preventDefault();
        const footer = document.querySelector('footer');
        if (footer) {
            footer.scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    });
});

// ===========================
// Console Welcome Message
// ===========================
console.log(`
%c  ████████╗███████╗ ██████╗██╗  ██╗███████╗████████╗ ██████╗ ██████╗ ███████╗
  ╚══██╔══╝██╔════╝██╔════╝██║  ██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
     ██║   █████╗  ██║     ███████║███████╗   ██║   ██║   ██║██████╔╝█████╗  
     ██║   ██╔══╝  ██║     ██╔══██║╚════██║   ██║   ██║   ██║██╔══██╗██╔══╝  
     ██║   ███████╗╚██████╗██║  ██║███████║   ██║   ╚██████╔╝██║  ██║███████╗
     ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
     
  E-Commerce Prototype v1.0
  Built with vanilla JavaScript
`, 'color: #00d9ff; font-weight: bold;');
