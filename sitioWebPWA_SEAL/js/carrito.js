import {
  addToCart,
  clearCart,
  escapeHtml,
  formatPrice,
  getCart,
  getFavorites,
  loadProducts,
  removeFromCart,
  showToast,
  toggleFavorite,
  updateCartQuantity,
} from './main.js';

let promoDiscountRate = 0;

function calculateTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const discount = Math.round(subtotal * promoDiscountRate);
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount === 0 || afterDiscount >= 250 ? 0 : 18;
  const total = afterDiscount + shipping;
  return { subtotal, discount, shipping, total };
}

async function initCartPage() {
  const cartContainer = document.querySelector('[data-cart-items]');
  const summaryContainer = document.querySelector('[data-cart-summary]');
  const favContainer = document.querySelector('[data-favorites-grid]');
  const orderReceipt = document.querySelector('[data-order-receipt]');

  if (!cartContainer) return;

  let products = [];
  try {
    products = await loadProducts();
  } catch {
    products = [];
  }

  const renderCart = () => {
    const cart = getCart();

    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-state">
          <h2 class="empty-state__title">Tu carrito está vacío</h2>
          <p class="empty-state__text">
            Explora el catálogo para añadir luminarias, mobiliario o sistemas de audio a tu selección.
          </p>
          <a href="catalogo.html" class="btn btn--primary">Explorar catálogo</a>
        </div>
      `;
    } else {
      cartContainer.innerHTML = cart
        .map(
          (item) => `
            <article class="cart-item" data-cart-key="${escapeHtml(item.key)}">
              <a href="producto.html?id=${encodeURIComponent(item.id)}">
                <img class="cart-item__thumb" src="${escapeHtml(item.imagen)}" alt="${escapeHtml(item.nombre)}" />
              </a>
              <div class="cart-item__info">
                <span class="product-card__meta">${escapeHtml(item.categoria)} · ${escapeHtml(item.acabado)}</span>
                <h3 class="product-card__title">
                  <a href="producto.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.nombre)}</a>
                </h3>
                <span class="price-current">${formatPrice(item.precio)} unidad</span>
              </div>
              <div class="cart-item__controls">
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" data-key="${escapeHtml(item.key)}" aria-label="Disminuir cantidad">−</button>
                  <span class="stepper__value">${item.cantidad}</span>
                  <button type="button" class="stepper__btn" data-step="1" data-key="${escapeHtml(item.key)}" aria-label="Aumentar cantidad">+</button>
                </div>
                <strong class="tabular-nums">${formatPrice(item.precio * item.cantidad)}</strong>
                <button type="button" class="btn btn--ghost" data-remove="${escapeHtml(item.key)}">
                  Eliminar
                </button>
              </div>
            </article>
          `,
        )
        .join('');
    }

    renderSummary(cart);
  };

  const renderSummary = (cart) => {
    if (!summaryContainer) return;
    const { subtotal, discount, shipping, total } = calculateTotals(cart);

    summaryContainer.innerHTML = `
      <h2 style="font-size: 1.375rem;">Resumen del pedido</h2>
      <form class="promo-form" data-promo-form>
        <label class="sr-only" for="promo-input">Código promocional</label>
        <input
          id="promo-input"
          type="text"
          class="field__input"
          placeholder="Código (ej. MODULO10)"
          value="${promoDiscountRate > 0 ? 'MODULO10' : ''}"
        />
        <button type="submit" class="btn btn--secondary">Aplicar</button>
      </form>
      <div class="summary-row">
        <span>Subtotal</span>
        <span class="tabular-nums">${formatPrice(subtotal)}</span>
      </div>
      ${
        discount > 0
          ? `<div class="summary-row" style="color: var(--success);">
               <span>Descuento MODULO10 (10%)</span>
               <span class="tabular-nums">−${formatPrice(discount)}</span>
             </div>`
          : ''
      }
      <div class="summary-row">
        <span>Envío asegurado</span>
        <span class="tabular-nums">${cart.length === 0 ? formatPrice(0) : shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
      </div>
      <div class="summary-row summary-row--total">
        <span>Total</span>
        <span class="tabular-nums">${formatPrice(total)}</span>
      </div>

      <form class="field" data-checkout-form novalidate style="gap: 12px; padding-top: 8px; border-top: 1px solid var(--border-hairline);">
        <div class="field">
          <label class="field__label" for="checkout-name">Nombre y apellidos</label>
          <input id="checkout-name" name="nombre" type="text" class="field__input" placeholder="Ej. Sofía Navarro" required />
        </div>
        <div class="field">
          <label class="field__label" for="checkout-email">Correo de confirmación</label>
          <input id="checkout-email" name="email" type="email" class="field__input" placeholder="sofia@estudio.com" required />
        </div>
        <div class="field">
          <label class="field__label" for="checkout-address">Dirección de entrega</label>
          <input id="checkout-address" name="direccion" type="text" class="field__input" placeholder="Calle, número y código postal" required />
        </div>
        <p class="field__error" data-checkout-error hidden></p>
        <button type="submit" class="btn btn--primary" ${cart.length === 0 ? 'disabled' : ''}>
          Confirmar pedido
        </button>
      </form>
    `;

    const promoForm = summaryContainer.querySelector('[data-promo-form]');
    if (promoForm) {
      promoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = promoForm.querySelector('#promo-input').value.trim().toUpperCase();
        if (code === 'MODULO10') {
          promoDiscountRate = 0.1;
          showToast('Código MODULO10 aplicado (10% de descuento).');
        } else if (code === '') {
          promoDiscountRate = 0;
        } else {
          showToast('Código no reconocido. Prueba con MODULO10.');
          return;
        }
        renderSummary(getCart());
      });
    }

    const checkoutForm = summaryContainer.querySelector('[data-checkout-form]');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentCart = getCart();
        if (currentCart.length === 0) return;

        const name = checkoutForm.nombre.value.trim();
        const email = checkoutForm.email.value.trim();
        const address = checkoutForm.direccion.value.trim();
        const errEl = checkoutForm.querySelector('[data-checkout-error]');

        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (name.length < 3 || !emailOk || address.length < 8) {
          errEl.textContent = 'Completa nombre, correo válido y dirección de entrega para confirmar.';
          errEl.hidden = false;
          return;
        }

        errEl.hidden = true;
        const { total: finalTotal } = calculateTotals(currentCart);
        const orderCode = `MD-${Math.floor(1000 + Math.random() * 9000)}`;

        if (orderReceipt) {
          orderReceipt.hidden = false;
          orderReceipt.innerHTML = `
            <div class="status-banner" role="status">
              <strong>Pedido ${orderCode} confirmado · En preparación</strong>
              <p>
                Hemos registrado tu solicitud a nombre de <strong>${escapeHtml(name)}</strong> (${escapeHtml(email)})
                con envío a <strong>${escapeHtml(address)}</strong> por un total de
                <strong class="tabular-nums">${formatPrice(finalTotal)}</strong>.
              </p>
            </div>
          `;
        }

        promoDiscountRate = 0;
        clearCart();
        showToast(`Pedido ${orderCode} confirmado.`);
      });
    }
  };

  const renderFavorites = () => {
    if (!favContainer) return;
    const favIds = getFavorites();
    const favProducts = products.filter((p) => favIds.includes(p.id));

    if (favProducts.length === 0) {
      favContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3 class="empty-state__title">No tienes piezas guardadas en favoritos</h3>
          <p class="empty-state__text">
            Marca cualquier objeto con el icono de corazón en el catálogo para conservarlo aquí.
          </p>
        </div>
      `;
      return;
    }

    favContainer.innerHTML = favProducts
      .map(
        (product) => `
          <article class="product-card">
            <a class="product-card__media" href="producto.html?id=${encodeURIComponent(product.id)}">
              <img src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}" />
            </a>
            <div class="product-card__body">
              <div class="product-card__meta">
                <span>${escapeHtml(product.categoria)}</span>
                <span aria-hidden="true">·</span>
                <span>${formatPrice(product.precio)}</span>
              </div>
              <h3 class="product-card__title">
                <a href="producto.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.nombre)}</a>
              </h3>
              <div class="product-card__footer">
                <button type="button" class="btn btn--ghost" data-fav-remove="${escapeHtml(product.id)}">
                  Quitar
                </button>
                <button
                  type="button"
                  class="btn btn--primary"
                  data-fav-move="${escapeHtml(product.id)}"
                  ${product.stock <= 0 ? 'disabled' : ''}
                >
                  ${product.stock <= 0 ? 'Agotado' : 'Mover al carrito'}
                </button>
              </div>
            </div>
          </article>
        `,
      )
      .join('');
  };

  cartContainer.addEventListener('click', (event) => {
    const stepBtn = event.target.closest('[data-step]');
    if (stepBtn) {
      const key = stepBtn.getAttribute('data-key');
      const delta = Number(stepBtn.getAttribute('data-step'));
      updateCartQuantity(key, delta);
      return;
    }

    const removeBtn = event.target.closest('[data-remove]');
    if (removeBtn) {
      removeFromCart(removeBtn.getAttribute('data-remove'));
    }
  });

  if (favContainer) {
    favContainer.addEventListener('click', (event) => {
      const moveBtn = event.target.closest('[data-fav-move]');
      if (moveBtn) {
        const id = moveBtn.getAttribute('data-fav-move');
        const product = products.find((p) => p.id === id);
        if (product && addToCart(product, 1)) {
          toggleFavorite(id);
        }
        return;
      }

      const removeBtn = event.target.closest('[data-fav-remove]');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-fav-remove');
        const product = products.find((p) => p.id === id);
        toggleFavorite(id, product?.nombre || '');
      }
    });
  }

  window.addEventListener('cart:updated', renderCart);
  window.addEventListener('favorites:updated', renderFavorites);

  renderCart();
  renderFavorites();
}

document.addEventListener('DOMContentLoaded', initCartPage);
