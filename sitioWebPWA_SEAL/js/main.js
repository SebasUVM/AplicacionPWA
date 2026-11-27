const STORAGE_KEYS = {
  theme: 'modulo_theme',
  cart: 'modulo_cart',
  favorites: 'modulo_favorites',
  promoDismissed: 'modulo_promo_dismissed',
};

let productsCache = null;

export async function loadProducts() {
  if (productsCache) return productsCache;
  const response = await fetch('data/productos.json');
  if (!response.ok) {
    throw new Error('No se pudo cargar el catálogo de productos.');
  }
  productsCache = await response.json();
  return productsCache;
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/* --- Tema Oscuro / Claro --- */
export function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  const toggleBtn = document.querySelector('[data-theme-toggle]');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    toggleBtn.setAttribute(
      'aria-label',
      isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro',
    );
    const label = toggleBtn.querySelector('.theme-toggle__label');
    if (label) {
      label.textContent = isDark ? 'Tema claro' : 'Tema oscuro';
    }
    const sunIcon = toggleBtn.querySelector('[data-icon="sun"]');
    const moonIcon = toggleBtn.querySelector('[data-icon="moon"]');
    if (sunIcon && moonIcon) {
      sunIcon.hidden = !isDark;
      moonIcon.hidden = isDark;
    }
  }
}

export function initTheme() {
  applyTheme(getPreferredTheme());
  const toggleBtn = document.querySelector('[data-theme-toggle]');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      applyTheme(next);
    });
  }
}

/* --- Carrito --- */
export function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cart);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  syncHeaderCounters();
  window.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.cantidad, 0);
}

export function addToCart(product, cantidad = 1, acabado = null) {
  if (!product || product.stock <= 0) {
    showToast('Esta pieza está temporalmente agotada.');
    return false;
  }
  const chosenFinish = acabado || (product.acabados?.[0]?.nombre ?? 'Estándar');
  const cart = getCart();
  const key = `${product.id}__${chosenFinish}`;
  const existing = cart.find((item) => item.key === key);

  if (existing) {
    const nextQty = Math.min(product.stock, existing.cantidad + cantidad);
    existing.cantidad = nextQty;
  } else {
    cart.push({
      key,
      id: product.id,
      nombre: product.nombre,
      categoria: product.categoria,
      precio: product.precio,
      imagen: product.imagen,
      acabado: chosenFinish,
      stock: product.stock,
      cantidad: Math.min(product.stock, cantidad),
    });
  }

  saveCart(cart);
  showToast(`Agregado al carrito: ${product.nombre}`);
  return true;
}

export function updateCartQuantity(key, delta) {
  const cart = getCart();
  const item = cart.find((entry) => entry.key === key);
  if (!item) return;

  const nextQty = item.cantidad + delta;
  if (nextQty <= 0) {
    saveCart(cart.filter((entry) => entry.key !== key));
  } else {
    item.cantidad = Math.min(item.stock, nextQty);
    saveCart(cart);
  }
}

export function removeFromCart(key) {
  const cart = getCart().filter((entry) => entry.key !== key);
  saveCart(cart);
  showToast('Pieza eliminada del carrito.');
}

export function clearCart() {
  saveCart([]);
}

/* --- Favoritos --- */
export function getFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id, productName = '') {
  const favs = getFavorites();
  const exists = favs.includes(id);
  const next = exists ? favs.filter((item) => item !== id) : [...favs, id];
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(next));
  syncHeaderCounters();
  window.dispatchEvent(new CustomEvent('favorites:updated', { detail: next }));

  if (productName) {
    showToast(
      exists
        ? `Eliminado de favoritos: ${productName}`
        : `Guardado en favoritos: ${productName}`,
    );
  }
  return !exists;
}

/* --- Navegación y Contadores --- */
export function syncHeaderCounters() {
  const cartCount = getCartCount();
  const favCount = getFavorites().length;

  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(cartCount);
  });

  document.querySelectorAll('[data-fav-count]').forEach((el) => {
    el.textContent = String(favCount);
  });
}

function initPromoStrip() {
  const strip = document.querySelector('[data-promo-strip]');
  if (!strip) return;
  if (sessionStorage.getItem(STORAGE_KEYS.promoDismissed) === 'true') {
    strip.hidden = true;
    return;
  }
  const closeBtn = strip.querySelector('[data-promo-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      strip.hidden = true;
      sessionStorage.setItem(STORAGE_KEYS.promoDismissed, 'true');
    });
  }
}

function initMobileMenu() {
  const toggleBtn = document.querySelector('[data-menu-toggle]');
  const drawer = document.querySelector('[data-mobile-drawer]');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const open = drawer.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', String(open));
  });
}

/* --- Notificaciones Toast --- */
export function showToast(message) {
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" class="btn--ghost" aria-label="Cerrar aviso">Cerrar</button>
  `;

  const remove = () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  };

  toast.querySelector('button').addEventListener('click', remove);
  region.appendChild(toast);
  window.setTimeout(remove, 3200);
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* --- Renderizado compartido de tarjetas --- */
export function renderProductCard(product) {
  const favActive = isFavorite(product.id);
  const outOfStock = product.stock <= 0;
  const stockMeta = outOfStock ? 'Agotado' : 'En stock';

  return `
    <article class="product-card" data-product-id="${escapeHtml(product.id)}">
      <div class="product-card__media">
        <a href="producto.html?id=${encodeURIComponent(product.id)}" aria-label="Ver detalles de ${escapeHtml(product.nombre)}">
          <img src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}" loading="lazy" />
        </a>
        <button
          type="button"
          class="product-card__fav ${favActive ? 'is-active' : ''}"
          data-toggle-fav="${escapeHtml(product.id)}"
          aria-pressed="${favActive}"
          aria-label="${favActive ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${favActive ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M12 20.5s-7.5-4.7-9.4-9.1C1.1 7.9 3.2 4.5 6.8 4.5c2.1 0 3.9 1.1 5.2 2.8 1.3-1.7 3.1-2.8 5.2-2.8 3.6 0 5.7 3.4 4.2 6.9-1.9 4.4-9.4 9.1-9.4 9.1z" />
          </svg>
        </button>
      </div>
      <div class="product-card__body">
        <div class="product-card__meta">
          <span>${escapeHtml(product.categoria)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(product.sku)}</span>
          <span aria-hidden="true">·</span>
          <span>${stockMeta}</span>
        </div>
        <h3 class="product-card__title">
          <a href="producto.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.nombre)}</a>
        </h3>
        <p class="product-card__desc">${escapeHtml(product.descripcionCorta)}</p>
        <div class="product-card__footer">
          <div class="price-group">
            <span class="price-current">${formatPrice(product.precio)}</span>
            ${product.precioAnterior ? `<span class="price-old">${formatPrice(product.precioAnterior)}</span>` : ''}
          </div>
          <button
            type="button"
            class="btn ${outOfStock ? 'btn--secondary' : 'btn--primary'}"
            data-add-cart="${escapeHtml(product.id)}"
            ${outOfStock ? 'disabled' : ''}
          >
            ${outOfStock ? 'Sin existencias' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  `;
}

export function bindProductGridActions(container, products) {
  if (!container) return;

  container.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-add-cart]');
    if (addBtn) {
      const id = addBtn.getAttribute('data-add-cart');
      const product = products.find((p) => p.id === id);
      if (product) addToCart(product, 1);
      return;
    }

    const favBtn = event.target.closest('[data-toggle-fav]');
    if (favBtn) {
      const id = favBtn.getAttribute('data-toggle-fav');
      const product = products.find((p) => p.id === id);
      const active = toggleFavorite(id, product?.nombre || '');
      favBtn.classList.toggle('is-active', active);
      favBtn.setAttribute('aria-pressed', String(active));
      favBtn.setAttribute(
        'aria-label',
        active ? 'Quitar de favoritos' : 'Guardar en favoritos',
      );
      const svg = favBtn.querySelector('svg');
      if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPromoStrip();
  initMobileMenu();
  syncHeaderCounters();
});

/* --- PWA: registro del service worker --- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('../sw.js', import.meta.url))
      .then((reg) => console.log('SW registrado:', reg.scope))
      .catch((err) => console.error('Error al registrar SW:', err));
  });
}
