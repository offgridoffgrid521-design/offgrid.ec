document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. CONFIGURACIÓN GLOBAL
    // ==========================================
    const API_URL = 'https://offgrid-ec-back.onrender.com/api'; 
    window.carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

    // ==========================================
    // 2. INICIALIZACIÓN
    // ==========================================
    inicializarUI();
    cargarCategoriasSidebarAPI(API_URL);
    cargarProductosAPI(API_URL);
    cargarDetalleProductoAPI(API_URL);
});

// ==========================================
// 3. LÓGICA DE INTERFAZ Y EVENTOS
// ==========================================
function inicializarUI() {
    
    // --- Toasts ---
    window.showToast = (message, type = 'info') => {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        const bgClass = type === 'success' ? 'bg-primary-500' : type === 'error' ? 'bg-red-600' : 'bg-gray-900';
        toast.className = `toast-notification fixed bottom-4 right-4 z-[110] flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl text-white transition-all duration-300 transform translate-y-full opacity-0 ${bgClass}`;
        
        const icon = type === 'success' 
            ? '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' 
            : '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        
        toast.innerHTML = `${icon}<span class="font-medium">${message}</span>`;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.remove('translate-y-full', 'opacity-0'));
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // --- Funciones del Carrito Lateral ---
    const cartDrawer = document.getElementById('cart-drawer');
    const cartContent = document.getElementById('cart-content');
    
    window.openCart = () => {
        if(!cartDrawer) return;
        cartDrawer.classList.remove('hidden');
        setTimeout(() => cartContent.classList.remove('translate-x-full'), 10);
        renderizarCarritoUI();
    };

    window.closeCart = () => {
        if(!cartContent) return;
        cartContent.classList.add('translate-x-full');
        setTimeout(() => cartDrawer.classList.add('hidden'), 300);
    };

    window.renderizarCarritoUI = () => {
        const badge = document.getElementById('cart-count-badge');
        const container = document.getElementById('cart-items-container');
        const totalEl = document.getElementById('cart-total-price');
        const btnCheckout = document.getElementById('btn-go-checkout');
        
        let total = 0;
        let count = 0;
        
        if (container) container.innerHTML = '';
        
        if (window.carrito.length === 0) {
            if (badge) badge.classList.add('scale-0');
            if (container) container.innerHTML = '<div class="text-center mt-10 text-gray-500"><svg class="h-16 w-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>Tu bolsa está vacía</div>';
            if (btnCheckout) btnCheckout.classList.add('opacity-50', 'pointer-events-none');
        } else {
            window.carrito.forEach(item => {
                count += item.cantidad;
                total += item.price * item.cantidad;
                if (container) {
                    container.innerHTML += `
                        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                            <div class="w-20 h-20 bg-darkcard rounded-xl flex items-center justify-center overflow-hidden">
                                <img src="${item.image}" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-sm text-white line-clamp-1">${item.name}</h4>
                                <p class="text-primary-500 font-semibold mt-1">$${item.price.toFixed(2)}</p>
                                <p class="text-xs text-gray-500 mt-1">Cant: ${item.cantidad}</p>
                            </div>
                            <button onclick="removerItem(${item.id})" class="text-gray-500 hover:text-red-500 p-2 transition-colors">
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    `;
                }
            });
            if (badge) {
                badge.textContent = count;
                badge.classList.remove('scale-0');
            }
            if (btnCheckout) btnCheckout.classList.remove('opacity-50', 'pointer-events-none');
        }
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    };

    window.removerItem = (id) => {
        window.carrito = window.carrito.filter(item => item.id != id);
        localStorage.setItem('carrito', JSON.stringify(window.carrito));
        renderizarCarritoUI();
    };

    renderizarCarritoUI(); 

    // --- EVENT DELEGATION GLOBAL ---
    document.body.addEventListener('click', (e) => {
        
        if (e.target.closest('#mobile-menu-toggle')) {
            document.getElementById('mobile-menu')?.classList.toggle('hidden');
        }

        const searchToggle = e.target.closest('button:has(svg path[d*="M21 21l-6-6m2-5a7"])'); 
        if (searchToggle && !e.target.closest('#search-content')) {
            const modal = document.getElementById('search-modal');
            const content = document.getElementById('search-content');
            modal?.classList.remove('hidden');
            modal?.classList.add('flex');
            setTimeout(() => content?.classList.remove('-translate-y-10'), 10);
            document.getElementById('search-input')?.focus();
        }

        if (e.target.closest('#close-search') || e.target.id === 'search-modal') {
            const modal = document.getElementById('search-modal');
            const content = document.getElementById('search-content');
            content?.classList.add('-translate-y-10');
            setTimeout(() => {
                modal?.classList.add('hidden');
                modal?.classList.remove('flex');
            }, 300);
        }

        if (e.target.closest('#cart-toggle')) {
            window.openCart();
        }
        if (e.target.closest('#close-cart') || e.target.id === 'close-cart-overlay') {
            window.closeCart();
        }

        const wishlistBtn = e.target.closest('#wishlist-toggle');
        if (wishlistBtn) {
            window.showToast('Funcionalidad de Favoritos en construcción', 'info');
        }

        // ==========================================
        // LÓGICA CORREGIDA DE AÑADIR AL CARRITO
        // ==========================================
        const btnCartAdd = e.target.closest('[data-add-to-cart]');
        if (btnCartAdd) {
            e.preventDefault();
            const name = btnCartAdd.dataset.name;
            const price = parseFloat(btnCartAdd.dataset.price);
            const image = btnCartAdd.dataset.image;

            // ESTRICTO: Buscar el radio button de la talla
            const tallaSeleccionada = document.querySelector('input[name="talla_inventory_id"]:checked');
            
            if (!tallaSeleccionada) {
                window.showToast('Por favor, selecciona una talla para continuar.', 'error');
                return;
            }

            // Usar el ID del Inventario como ID real de la compra
            const inventory_id = tallaSeleccionada.value;
            
            // Extraer el texto visual de la talla (ej. "10", "8", etc.)
            const sizeName = tallaSeleccionada.nextElementSibling.textContent.trim();
            const nombreConTalla = `${name} (Talla ${sizeName})`;

            const itemExistente = window.carrito.find(item => item.id == inventory_id);
            if (itemExistente) {
                itemExistente.cantidad++;
            } else {
                window.carrito.push({ id: inventory_id, name: nombreConTalla, price, image, cantidad: 1 });
            }

            localStorage.setItem('carrito', JSON.stringify(window.carrito));
            renderizarCarritoUI();
            window.openCart(); 
            window.showToast('¡Agregado a tu bolsa!', 'success');
        }

        const btnCardWish = e.target.closest('[data-add-to-wishlist]');
        if (btnCardWish) {
            e.preventDefault();
            const icon = btnCardWish.querySelector('svg');
            if (icon.getAttribute('fill') === 'currentColor') {
                icon.setAttribute('fill', 'none');
                icon.classList.remove('text-red-500');
                window.showToast('Eliminado de favoritos', 'info');
            } else {
                icon.setAttribute('fill', 'currentColor');
                icon.classList.add('text-red-500');
                window.showToast('¡Agregado a favoritos!', 'success');
            }
        }
        
        if (e.target.closest('#auth-toggle')) {
            const modal = document.getElementById('auth-modal');
            modal?.classList.remove('hidden');
            modal?.classList.add('flex');
        }
        if (e.target.closest('#close-auth') || e.target.id === 'auth-modal') {
            const modal = document.getElementById('auth-modal');
            modal?.classList.add('hidden');
            modal?.classList.remove('flex');
        }
    });

    document.body.addEventListener('submit', (e) => {
        if (e.target.id === 'auth-form' || e.target.closest('#auth-modal form')) {
            e.preventDefault();
            document.getElementById('auth-modal')?.classList.add('hidden');
            document.getElementById('auth-modal')?.classList.remove('flex');
            window.showToast('Acceso exitoso', 'success');
        }
    });
}

// ==========================================
// 4. CONSUMO DE API: CATEGORÍAS EN SIDEBAR
// ==========================================
async function cargarCategoriasSidebarAPI(apiUrl) {
    const listaCategorias = document.getElementById('lista-categorias-sidebar');
    if (!listaCategorias) return; 

    try {
        const respuesta = await fetch(`${apiUrl}/categorias`);
        if (!respuesta.ok) throw new Error('Error al obtener categorías');
        
        const categorias = await respuesta.json();
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaActual = urlParams.get('categoria');

        let html = `
            <li>
                <a href="tienda.html" class="flex items-center justify-between ${!categoriaActual || categoriaActual === '' ? 'bg-primary-500/10 text-primary-500 font-semibold' : 'text-gray-400 hover:text-white'} rounded-xl px-4 py-2.5 text-sm transition-colors">
                    <span>All Products</span>
                </a>
            </li>
        `;

        categorias.forEach(cat => {
            const isActive = categoriaActual && categoriaActual.toLowerCase() === cat.slug.toLowerCase();
            const cssClass = isActive ? 'bg-primary-500/10 text-primary-500 font-semibold' : 'text-gray-400 hover:text-white';
            
            html += `
                <li>
                    <a href="tienda.html?categoria=${cat.slug}" class="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors ${cssClass}">
                        <span>${cat.name}</span>
                    </a>
                </li>
            `;
        });

        listaCategorias.innerHTML = html;
    } catch (error) {
        listaCategorias.innerHTML = `<li class="text-red-500 text-sm">Error cargando menú</li>`;
    }
}

// ==========================================
// 5. CONSUMO DE API: GRID DE PRODUCTOS
// ==========================================
async function cargarProductosAPI(apiUrl) {
    const gridProductos = document.getElementById('productos-grid');
    if (!gridProductos) return; 

    const urlParams = new URLSearchParams(window.location.search);
    const categoriaFiltro = urlParams.get('categoria'); 

    const linksSidebar = document.querySelectorAll('aside ul li a');
    linksSidebar.forEach(link => {
        const linkUrl = new URL(link.href, window.location.href);
        const linkCat = linkUrl.searchParams.get('categoria');
        
        if (categoriaFiltro === linkCat) {
            link.className = 'flex items-center justify-between bg-primary-500/10 text-primary-500 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors';
        } else {
            link.className = 'flex items-center justify-between text-gray-400 hover:text-white rounded-xl px-4 py-2.5 text-sm transition-colors';
        }
    });

    try {
        const respuesta = await fetch(`${apiUrl}/productos`);
        if (!respuesta.ok) throw new Error('Error de red al obtener productos');
        
        const todosLosProductos = await respuesta.json();
        let productosAEnseñar = todosLosProductos;
        
        if (categoriaFiltro) {
            const filtroNormalizado = categoriaFiltro.toLowerCase();
            
            if (filtroNormalizado === 'nuevos') {
                productosAEnseñar = todosLosProductos.filter(prod => prod.is_new);
                const titulo = document.getElementById('categoria-titulo');
                const breadcrumb = document.getElementById('breadcrumb-actual');
                if(titulo) titulo.textContent = "Nuevos Lanzamientos";
                if(breadcrumb) breadcrumb.textContent = "Nuevos Lanzamientos";
            } else {
                productosAEnseñar = todosLosProductos.filter(prod => 
                    (prod.categoria_slug && prod.categoria_slug.toLowerCase() === filtroNormalizado) || 
                    (prod.categoria_nombre && prod.categoria_nombre.toLowerCase() === filtroNormalizado)
                );
                
                const titulo = document.getElementById('categoria-titulo');
                if (titulo) {
                    if (productosAEnseñar.length > 0 && productosAEnseñar[0].categoria_nombre) {
                        titulo.textContent = productosAEnseñar[0].categoria_nombre;
                        const bread = document.getElementById('breadcrumb-actual');
                        if (bread) bread.textContent = productosAEnseñar[0].categoria_nombre;
                    } else {
                        titulo.textContent = categoriaFiltro.charAt(0).toUpperCase() + categoriaFiltro.slice(1);
                    }
                }
            }
        }

        const contador = document.getElementById('contador-productos');
        if (contador) contador.textContent = `${productosAEnseñar.length} productos`;

        gridProductos.innerHTML = ''; 
        
        if (productosAEnseñar.length === 0) {
            gridProductos.innerHTML = `<div class="col-span-full py-16 text-center border border-white/5 rounded-3xl bg-darkcard/50"><h3 class="text-xl text-white font-bold">Sin resultados</h3><p class="text-gray-500 mt-2">No encontramos zapatillas en esta categoría.</p></div>`;
            return;
        }

        productosAEnseñar.forEach(prod => {
            const safeName = prod.name.replace(/"/g, '&quot;');
            const imgUrl = prod.image_url ? prod.image_url : 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=500&fit=crop';
            const badgeHTML = prod.is_new ? '<span class="absolute left-4 top-4 rounded bg-green-500 px-2 py-1 text-[10px] font-bold text-white z-10">NEW</span>' : '';

            // ========================================================
            // CORRECCIÓN: Botón "Añadir" cambiado a "Ver Detalles"
            // ========================================================
            const card = `
                <div class="group">
                    <div class="relative overflow-hidden rounded-3xl bg-gray-200 dark:bg-darkcard aspect-square flex items-center justify-center transition-transform hover:-translate-y-2 cursor-pointer">
                        ${badgeHTML}
                        <a href="productos.html?id=${prod.id}" class="absolute inset-0 z-0"></a>
                        <img src="${imgUrl}" alt="${safeName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-0">
                        
                        <div class="absolute bottom-4 left-4 right-4 flex gap-2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                            
                            <a href="productos.html?id=${prod.id}" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-gray-900 shadow-lg hover:bg-gray-100 transition-colors">
                                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                Ver Detalles
                            </a>
                            
                            <button class="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg hover:bg-gray-100" data-add-to-wishlist="${prod.id}">
                                <svg class="h-5 w-5 text-gray-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>${prod.categoria_nombre || 'Categoría'}</span>
                        </div>
                        <h3 class="mt-1 font-bold text-lg text-gray-900 dark:text-white hover:text-primary-500 transition-colors"><a href="productos.html?id=${prod.id}">${prod.name}</a></h3>
                        <div class="mt-1 font-display text-xl font-bold text-gray-900 dark:text-white">$${parseFloat(prod.base_price).toFixed(2)}</div>
                    </div>
                </div>
            `;
            gridProductos.insertAdjacentHTML('beforeend', card);
        });

    } catch (error) {
        gridProductos.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 bg-red-900/10 rounded-2xl border border-red-900/30">
                <h3 class="text-lg font-bold text-red-400">Error de Conexión</h3>
                <p class="text-red-500 mt-2">No se pudo cargar el catálogo de productos.</p>
            </div>
        `;
    }
}

// ==========================================
// 6. DETALLE DEL PRODUCTO (TALLAS DINÁMICAS)
// ==========================================
async function cargarDetalleProductoAPI(apiUrl) {
    const contenedorProducto = document.getElementById('producto-container');
    const skeletonProducto = document.getElementById('producto-skeleton');
    if (!contenedorProducto || !skeletonProducto) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        skeletonProducto.innerHTML = `<div class="col-span-full py-16 text-center"><h3 class="text-xl text-gray-900 dark:text-white font-bold">Error</h3><p class="text-red-500 mt-2">Producto no especificado.</p></div>`;
        return;
    }

    try {
        const respuesta = await fetch(`${apiUrl}/productos/${productId}`);
        if (!respuesta.ok) throw new Error('Error al conectar con la base de datos');
        
        const prod = await respuesta.json();
        
        const imgUrl = prod.image_url ? prod.image_url : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&fit=crop';
        const safeName = prod.name.replace(/"/g, '&quot;');

        document.getElementById('prod-nombre').textContent = prod.name;
        
        const breadName = document.getElementById('prod-nombre-bread');
        if (breadName) breadName.textContent = prod.name;
        
        const categoryLabel = document.getElementById('prod-categoria');
        if (categoryLabel) categoryLabel.textContent = prod.categoria_nombre || 'General';
        
        const categoryLink = document.getElementById('prod-categoria-link');
        if (categoryLink) {
            categoryLink.textContent = prod.categoria_nombre || 'General';
            categoryLink.href = `tienda.html?categoria=${prod.categoria_slug || ''}`;
        }
        
        document.getElementById('prod-precio').textContent = `$${parseFloat(prod.base_price).toFixed(2)}`;
        
        if (prod.compare_at_price) {
            const compPrice = document.getElementById('prod-precio-comparacion');
            if (compPrice) {
                compPrice.textContent = `$${parseFloat(prod.compare_at_price).toFixed(2)}`;
                compPrice.classList.remove('hidden');
            }
        }
        
        const descElement = document.getElementById('prod-descripcion');
        if (descElement) descElement.textContent = prod.description || 'Sin descripción disponible.';
        
        const mainImg = document.getElementById('prod-imagen');
        if (mainImg) mainImg.src = imgUrl;
        
        const thumb1 = document.getElementById('prod-thumb-1');
        if (thumb1) thumb1.src = imgUrl;
        
        const thumb2 = document.getElementById('prod-thumb-2');
        if (thumb2) thumb2.src = imgUrl;
        
        if (prod.is_new) {
            const badge = document.getElementById('prod-badge');
            if (badge) badge.classList.remove('hidden');
        }

        const contenedorTallas = document.getElementById('contenedor-tallas');
        const btnCart = document.getElementById('btn-add-to-cart-dynamic');
        
        if (contenedorTallas && prod.tallas) {
            contenedorTallas.innerHTML = ''; 
            
            if (prod.tallas.length === 0) {
                contenedorTallas.innerHTML = '<p class="text-red-500 col-span-full font-bold">Agotado Temporalmente</p>';
                if(btnCart) {
                    btnCart.disabled = true;
                    btnCart.classList.add('opacity-50', 'cursor-not-allowed');
                    btnCart.innerHTML = 'Agotado';
                }
            } else {
                prod.tallas.forEach((talla, index) => {
                    const isChecked = index === 0 ? 'checked' : '';
                    contenedorTallas.innerHTML += `
                        <label class="cursor-pointer">
                            <input type="radio" name="talla_inventory_id" value="${talla.inventory_id}" class="size-radio hidden" ${isChecked}>
                            <div class="flex items-center justify-center py-3 rounded-xl border border-white/10 bg-darkcard text-gray-300 font-semibold hover:border-white/30 transition-colors">${talla.size}</div>
                        </label>
                    `;
                });
            }
        }

        if (btnCart) {
            btnCart.dataset.id = prod.id;
            btnCart.dataset.name = safeName;
            btnCart.dataset.price = prod.base_price;
            btnCart.dataset.image = imgUrl;
            btnCart.setAttribute('data-add-to-cart', 'true');
        }

        skeletonProducto.classList.add('hidden');
        contenedorProducto.classList.remove('hidden', 'opacity-0');

    } catch (error) {
        skeletonProducto.innerHTML = `<div class="col-span-full py-16 text-center"><h3 class="text-xl text-gray-900 dark:text-white font-bold">Error</h3><p class="text-red-500 mt-2">${error.message}</p></div>`;
    }
}
