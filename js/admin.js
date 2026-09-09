
const API_URL = 'https://offgrid-ec-back.onrender.com/api';
let globalCategorias = [];

document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    
    // Activar menú hamburguesa en versión móvil
    document.getElementById('admin-menu-toggle')?.addEventListener('click', () => {
        document.getElementById('admin-sidebar').classList.toggle('-translate-x-full');
    });
    
    // Auto-generadores de Slugs
    document.getElementById('cat-name')?.addEventListener('input', (e) => {
        document.getElementById('cat-slug').value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    });
    document.getElementById('prod-name')?.addEventListener('input', (e) => {
        document.getElementById('prod-slug').value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    });

    // Formulario Login
    document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.innerHTML = 'Verificando...'; btn.disabled = true;

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const respuesta = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await respuesta.json();

            if (respuesta.ok) {
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.usuario));
                mostrarToast('Bienvenido al panel', 'success');
                verificarAutenticacion();
            } else {
                mostrarToast(data.error || 'Credenciales incorrectas', 'error');
            }
        } catch (error) {
            mostrarToast('Error de conexión con el servidor', 'error');
        } finally {
            btn.innerHTML = 'Ingresar'; btn.disabled = false;
        }
    });

    // Formularios Modales Principales
    document.getElementById('form-categoria')?.addEventListener('submit', guardarCategoria);
    document.getElementById('form-producto')?.addEventListener('submit', guardarProducto);
    document.getElementById('form-nueva-talla')?.addEventListener('submit', guardarNuevaTalla);
});

// ==========================================
// SEGURIDAD Y NAVEGACIÓN UI
// ==========================================
function verificarAutenticacion() {
    const token = localStorage.getItem('admin_token');
    if (token) {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        
        const user = JSON.parse(localStorage.getItem('admin_user'));
        document.getElementById('admin-name').textContent = user ? user.nombre : 'Admin';
        
        cargarDashboard('mes'); 
        cargarCategorias();
        cargarProductos();
    } else {
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('dashboard-view').classList.add('hidden');
    }
}

window.cerrarSesion = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    verificarAutenticacion();
};

window.cambiarVista = (vista) => {
    const baseClass = 'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ';
    const activeClass = 'bg-primary-500/10 text-primary-500 font-semibold';
    const inactiveClass = 'text-gray-400 hover:text-white';

    document.getElementById('nav-dashboard').className = baseClass + (vista === 'dashboard' ? activeClass : inactiveClass);
    document.getElementById('nav-productos').className = baseClass + (vista === 'productos' ? activeClass : inactiveClass);
    document.getElementById('nav-categorias').className = baseClass + (vista === 'categorias' ? activeClass : inactiveClass);
    
    const titulos = { 'dashboard': 'Panel Principal', 'productos': 'Gestión de Productos', 'categorias': 'Gestión de Categorías' };
    document.getElementById('header-titulo').textContent = titulos[vista];
    
    document.getElementById('vista-dashboard').classList.toggle('hidden', vista !== 'dashboard');
    document.getElementById('vista-productos').classList.toggle('hidden', vista !== 'productos');
    document.getElementById('vista-categorias').classList.toggle('hidden', vista !== 'categorias');

    // Cierra el menú lateral automáticamente en móviles al seleccionar una opción
    if (window.innerWidth < 1024) {
        document.getElementById('admin-sidebar')?.classList.add('-translate-x-full');
    }
};

window.mostrarToast = (mensaje, tipo) => {
    alert(`${tipo === 'success' ? '✅' : '❌'} ${mensaje}`);
};

// ==========================================
// CONTROL DE MODALES
// ==========================================
window.abrirModalCategoria = (id = null, nombre = '', slug = '', desc = '') => {
    document.getElementById('modal-cat-titulo').textContent = id ? 'Editar Categoría' : 'Nueva Categoría';
    document.getElementById('cat-id').value = id || '';
    document.getElementById('cat-name').value = nombre;
    document.getElementById('cat-slug').value = slug;
    document.getElementById('cat-desc').value = desc;
    
    document.getElementById('modal-categoria').classList.remove('hidden');
    document.getElementById('modal-categoria').classList.add('flex');
};

window.abrirModalProducto = (id = null, nombre = '', slug = '', catId = '', precio = '', compPrecio = '', isNew = false, isBest = false, desc = '') => {
    document.getElementById('modal-prod-titulo').textContent = id ? 'Editar Producto' : 'Nuevo Producto';
    document.getElementById('prod-id').value = id || '';
    document.getElementById('prod-name').value = nombre;
    document.getElementById('prod-slug').value = slug;
    document.getElementById('prod-price').value = precio;
    document.getElementById('prod-compare').value = compPrecio || '';
    document.getElementById('prod-desc').value = desc;
    document.getElementById('prod-is-new').checked = isNew === 'true' || isNew === true;
    document.getElementById('prod-is-bestseller').checked = isBest === 'true' || isBest === true;
    
    const select = document.getElementById('prod-category');
    select.innerHTML = '<option value="">Seleccione una categoría...</option>';
    globalCategorias.forEach(c => {
        const selected = (c.id == catId) ? 'selected' : '';
        select.innerHTML += `<option value="${c.id}" ${selected}>${c.name}</option>`;
    });

    document.getElementById('modal-producto').classList.remove('hidden');
    document.getElementById('modal-producto').classList.add('flex');
};

window.cerrarModal = (idModal) => {
    document.getElementById(idModal).classList.add('hidden');
    document.getElementById(idModal).classList.remove('flex');
};

// ==========================================
// DASHBOARD
// ==========================================
window.cargarDashboard = async (rango) => {
    try {
        const res = await fetch(`${API_URL}/admin/dashboard?rango=${rango}`);
        const data = await res.json();
        
        if (res.ok) {
            document.getElementById('dash-ventas').textContent = `$${parseFloat(data.ventas).toFixed(2)}`;
            document.getElementById('dash-pedidos').textContent = data.pedidos;
            
            const visitasEstimadas = data.pedidos > 0 ? (data.pedidos * 15) + Math.floor(Math.random() * 50) : 0;
            document.getElementById('dash-visitas').textContent = visitasEstimadas;

            const tbody = document.getElementById('tabla-dash-pedidos');
            tbody.innerHTML = '';
            
            if (data.ultimos_pedidos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No hay pedidos en este rango de tiempo.</td></tr>';
            } else {
                data.ultimos_pedidos.forEach(pedido => {
                    tbody.innerHTML += `
                        <tr class="hover:bg-white/5 transition-colors">
                            <td class="px-6 py-4 font-bold text-white whitespace-nowrap">#${pedido.id}</td>
                            <td class="px-6 py-4 whitespace-nowrap">${pedido.customer_name}</td>
                            <td class="px-6 py-4 text-xs whitespace-nowrap">${pedido.created_at}</td>
                            <td class="px-6 py-4 font-semibold text-primary-500 whitespace-nowrap">$${parseFloat(pedido.total_amount).toFixed(2)}</td>
                            <td class="px-6 py-4 text-right whitespace-nowrap">
                                <span class="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs uppercase">${pedido.order_status}</span>
                            </td>
                        </tr>
                    `;
                });
            }
        }
    } catch (e) { console.error("Error cargando dashboard:", e); }
};

// ==========================================
// CRUD: CATEGORÍAS
// ==========================================
async function cargarCategorias() {
    try {
        const res = await fetch(`${API_URL}/categorias`);
        const data = await res.json();
        globalCategorias = data; 
        
        const tbody = document.getElementById('tabla-categorias');
        tbody.innerHTML = '';
        
        data.forEach(cat => {
            const safeDesc = (cat.description || '').replace(/'/g, "\\'");
            tbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">#${cat.id}</td>
                    <td class="px-6 py-4 font-bold text-white flex items-center gap-3 whitespace-nowrap">
                        <img src="${cat.image_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg bg-darkbg object-cover">
                        ${cat.name}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${cat.slug}</td>
                    <td class="px-6 py-4 text-right whitespace-nowrap">
                        <button onclick="abrirModalCategoria('${cat.id}', '${cat.name}', '${cat.slug}', '${safeDesc}')" class="text-blue-400 hover:text-blue-300 mr-3">Editar</button>
                        <button onclick="eliminarCategoria('${cat.id}')" class="text-red-500 hover:text-red-400">Borrar</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error('Error cargando categorías:', e); }
}

async function guardarCategoria(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cat');
    btn.innerHTML = 'Guardando...'; btn.disabled = true;

    const id = document.getElementById('cat-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('cat-name').value);
    formData.append('slug', document.getElementById('cat-slug').value);
    formData.append('description', document.getElementById('cat-desc').value);
    
    const imageFile = document.getElementById('cat-image').files[0];
    if (imageFile) formData.append('imagen', imageFile);

    try {
        const url = id ? `${API_URL}/admin/categorias/${id}` : `${API_URL}/admin/categorias`;
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, { method, body: formData });
        const data = await res.json();

        if (res.ok) {
            mostrarToast('Categoría guardada exitosamente', 'success');
            cerrarModal('modal-categoria');
            document.getElementById('form-categoria').reset();
            cargarCategorias();
        } else {
            mostrarToast(data.error, 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    } finally {
        btn.innerHTML = 'Guardar'; btn.disabled = false;
    }
}

window.eliminarCategoria = async (id) => {
    if(!confirm('¿Seguro que deseas eliminar esta categoría? (Se borrará su foto permanentemente de R2)')) return;
    try {
        const res = await fetch(`${API_URL}/admin/categorias/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) { mostrarToast('Categoría eliminada', 'success'); cargarCategorias(); } 
        else { mostrarToast(data.error, 'error'); }
    } catch(e) { mostrarToast('Error de conexión', 'error'); }
};

// ==========================================
// CRUD: PRODUCTOS
// ==========================================
async function cargarProductos() {
    try {
        const res = await fetch(`${API_URL}/productos`);
        const data = await res.json();
        
        const tbody = document.getElementById('tabla-productos');
        tbody.innerHTML = '';
        
        data.forEach(prod => {
            const safeName = prod.name.replace(/'/g, "\\'");
            const safeDesc = (prod.description || '').replace(/'/g, "\\'");
            
            tbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="px-6 py-4 font-bold text-white flex items-center gap-3 whitespace-nowrap">
                        <img src="${prod.image_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg bg-darkbg object-cover">
                        ${prod.name}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${prod.categoria_nombre}</td>
                    <td class="px-6 py-4 font-semibold text-white whitespace-nowrap">$${parseFloat(prod.base_price).toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${prod.is_new ? '<span class="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs mr-1">Nuevo</span>' : ''}
                        ${prod.is_bestseller ? '<span class="bg-primary-500/20 text-primary-500 px-2 py-1 rounded text-xs">Top</span>' : ''}
                    </td>
                    <td class="px-6 py-4 text-right whitespace-nowrap">
                        <button onclick="abrirInventario('${prod.id}', '${safeName}')" class="text-green-500 hover:text-green-400 mr-3 font-bold">📦 Stock</button>
                        <button onclick="abrirModalProducto('${prod.id}', '${safeName}', '${prod.slug}', '${prod.category_id || ''}', '${prod.base_price}', '${prod.compare_at_price || ''}', '${prod.is_new}', '${prod.is_bestseller}', '${safeDesc}')" class="text-blue-400 hover:text-blue-300 mr-3">Editar</button>
                        <button onclick="eliminarProducto('${prod.id}')" class="text-red-500 hover:text-red-400">Borrar</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error('Error cargando productos:', e); }
}

async function guardarProducto(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-prod');
    btn.innerHTML = 'Guardando...'; btn.disabled = true;

    const id = document.getElementById('prod-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('prod-name').value);
    formData.append('slug', document.getElementById('prod-slug').value);
    formData.append('category_id', document.getElementById('prod-category').value);
    formData.append('description', document.getElementById('prod-desc').value);
    formData.append('base_price', document.getElementById('prod-price').value);
    formData.append('compare_at_price', document.getElementById('prod-compare').value);
    formData.append('is_new', document.getElementById('prod-is-new').checked);
    formData.append('is_bestseller', document.getElementById('prod-is-bestseller').checked);
    
    const imageFile = document.getElementById('prod-image').files[0];
    if (imageFile) formData.append('imagen', imageFile);

    try {
        const url = id ? `${API_URL}/admin/productos/${id}` : `${API_URL}/admin/productos`;
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, { method, body: formData });
        const data = await res.json();

        if (res.ok) {
            mostrarToast('Producto guardado exitosamente', 'success');
            cerrarModal('modal-producto');
            document.getElementById('form-producto').reset();
            cargarProductos();
        } else {
            mostrarToast(data.error, 'error');
        }
    } catch (e) {
        mostrarToast('Error de conexión', 'error');
    } finally {
        btn.innerHTML = 'Guardar Producto'; btn.disabled = false;
    }
}

window.eliminarProducto = async (id) => {
    if(!confirm('¿Seguro que deseas eliminar este producto? (Se borrará su foto de R2)')) return;
    try {
        const res = await fetch(`${API_URL}/admin/productos/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) { mostrarToast('Producto eliminado', 'success'); cargarProductos(); } 
        else { mostrarToast(data.error, 'error'); }
    } catch(e) { mostrarToast('Error de conexión', 'error'); }
};

// ==========================================
// GESTIÓN DE INVENTARIO MANUAL (TALLAS Y STOCK)
// ==========================================
window.abrirInventario = async (id, nombre) => {
    document.getElementById('inv-prod-id').value = id;
    document.getElementById('inv-prod-name').textContent = nombre;
    document.getElementById('lista-tallas').innerHTML = '<p class="text-gray-500 text-sm">Cargando stock...</p>';
    
    document.getElementById('modal-inventario').classList.remove('hidden');
    document.getElementById('modal-inventario').classList.add('flex');
    
    await recargarTallas(id);
};

async function recargarTallas(productoId) {
    try {
        const res = await fetch(`${API_URL}/admin/productos/${productoId}/inventario`);
        const data = await res.json();
        
        document.getElementById('inv-color-id').value = data.color_id;
        const lista = document.getElementById('lista-tallas');
        lista.innerHTML = '';
        
        if(data.inventario.length === 0) {
            lista.innerHTML = '<p class="text-gray-500 text-sm">No hay tallas registradas para este producto.</p>';
        } else {
            data.inventario.forEach(talla => {
                lista.innerHTML += `
                    <div class="flex items-center justify-between bg-darkcard p-2 rounded-lg border border-white/5">
                        <div class="flex items-center gap-4">
                            <span class="text-white font-bold w-16">Talla ${talla.size}</span>
                            <input type="number" id="stock-${talla.inventory_id}" value="${talla.stock_quantity}" min="0" class="w-20 bg-[#0A0F1C] border border-gray-700 focus:border-primary-500 outline-none rounded px-2 py-1 text-white text-sm text-center">
                        </div>
                        <div class="flex gap-3">
                            <button onclick="actualizarStock(${talla.inventory_id})" class="text-blue-400 hover:text-blue-300 text-sm font-semibold">Guardar</button>
                            <button onclick="eliminarTalla(${talla.inventory_id})" class="text-red-500 hover:text-red-400 text-sm">Borrar</button>
                        </div>
                    </div>
                `;
            });
        }
    } catch(e) { console.error("Error cargando inventario", e); }
}

async function guardarNuevaTalla(e) {
    e.preventDefault();
    const color_id = document.getElementById('inv-color-id').value;
    const prod_id = document.getElementById('inv-prod-id').value;
    const size = document.getElementById('new-size').value;
    const stock = document.getElementById('new-stock').value;
    
    try {
        const res = await fetch(`${API_URL}/admin/inventario`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({color_id, size, stock})
        });
        if(res.ok) {
            mostrarToast('Talla agregada', 'success');
            document.getElementById('new-size').value = '';
            document.getElementById('new-stock').value = '';
            recargarTallas(prod_id); 
        } else {
            mostrarToast('Error al agregar', 'error');
        }
    } catch(e) { mostrarToast('Error de conexión', 'error'); }
}

window.actualizarStock = async (inventory_id) => {
    const stock = document.getElementById(`stock-${inventory_id}`).value;
    try {
        const res = await fetch(`${API_URL}/admin/inventario/${inventory_id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ stock })
        });
        if(res.ok) mostrarToast('Stock actualizado', 'success');
        else mostrarToast('Error', 'error');
    } catch(e) { mostrarToast('Error de conexión', 'error'); }
};

window.eliminarTalla = async (inventory_id) => {
    if(!confirm('¿Eliminar esta talla del inventario?')) return;
    const prod_id = document.getElementById('inv-prod-id').value;
    try {
        const res = await fetch(`${API_URL}/admin/inventario/${inventory_id}`, { method: 'DELETE' });
        if(res.ok) {
            mostrarToast('Talla eliminada', 'success');
            recargarTallas(prod_id);
        } else { mostrarToast('Error', 'error'); }
    } catch(e) { mostrarToast('Error de conexión', 'error'); }
};
