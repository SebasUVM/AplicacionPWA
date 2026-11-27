import {
  addToCart,
  bindProductGridActions,
  escapeHtml,
  formatPrice,
  isFavorite,
  loadProducts,
  renderProductCard,
  toggleFavorite,
} from './main.js';

async function initProductPage() {
  const rootEl = document.querySelector('[data-pdp-root]');
  const breadcrumbEl = document.querySelector('[data-pdp-breadcrumb]');
  const relatedGrid = document.querySelector('[data-related-grid]');
  if (!rootEl) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id') || 'p1';

  try {
    const products = await loadProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      rootEl.innerHTML = `
        <div class="empty-state">
          <h1 class="empty-state__title">Pieza no encontrada</h1>
          <p class="empty-state__text">
            La referencia solicitada no forma parte del catálogo activo o ha sido archivada.
          </p>
          <a href="catalogo.html" class="btn btn--primary">Volver al catálogo</a>
        </div>
      `;
      return;
    }

    document.title = `${product.nombre} — Módulo Estudio`;

    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `
        <a href="index.html">Inicio</a>
        <span aria-hidden="true">/</span>
        <a href="catalogo.html?categoria=${encodeURIComponent(product.categoria)}">${escapeHtml(product.categoria)}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHtml(product.nombre)}</span>
      `;
    }

    let selectedFinish = product.acabados?.[0]?.nombre || 'Estándar';
    let quantity = 1;
    const outOfStock = product.stock <= 0;

    const renderPdp = () => {
      const favActive = isFavorite(product.id);
      const specsRows = Object.entries(product.especificaciones || {})
        .map(
          ([key, val]) => `
            <div class="specs-table__row">
              <dt class="specs-table__key">${escapeHtml(key)}</dt>
              <dd class="specs-table__val">${escapeHtml(val)}</dd>
            </div>
          `,
        )
        .join('');

      rootEl.innerHTML = `
        <div class="pdp-grid">
          <div class="pdp-gallery">
            <div class="pdp-stage" data-pdp-stage>
              <img src="${escapeHtml(product.imagen)}" alt="${escapeHtml(product.nombre)}" />
            </div>
            <div class="segmented-tabs" role="group" aria-label="Modo de visualización">
              <button type="button" class="segmented-tab is-active" data-stage-mode="studio">
                Vista estudio
              </button>
              <button type="button" class="segmented-tab" data-stage-mode="technical">
                Retícula técnica
              </button>
            </div>
          </div>

          <div class="pdp-purchase">
            <div class="product-card__meta">
              <span>${escapeHtml(product.categoria)}</span>
              <span aria-hidden="true">·</span>
              <span>SKU ${escapeHtml(product.sku)}</span>
              <span aria-hidden="true">·</span>
              <span>Valoración ${product.valoracion.toFixed(1)} / 5</span>
            </div>

            <h1 class="pdp-title">${escapeHtml(product.nombre)}</h1>

            <div class="pdp-price-row">
              <div class="price-group">
                <span class="pdp-price">${formatPrice(product.precio)}</span>
                ${product.precioAnterior ? `<span class="price-old">${formatPrice(product.precioAnterior)}</span>` : ''}
              </div>
              <span class="stock-label ${outOfStock ? 'stock-label--out' : 'stock-label--ok'}">
                ${outOfStock ? 'Temporalmente agotado' : `En stock · ${product.stock} unidades`}
              </span>
            </div>

            <p>${escapeHtml(product.descripcionLarga)}</p>

            <div>
              <p class="field__label" style="margin-bottom: 10px;">
                Acabado seleccionado: <span data-selected-finish>${escapeHtml(selectedFinish)}</span>
              </p>
              <div class="variant-list" role="radiogroup" aria-label="Acabados disponibles">
                ${(product.acabados || [])
                  .map(
                    (acabado) => `
                      <button
                        type="button"
                        class="variant-btn ${acabado.nombre === selectedFinish ? 'is-selected' : ''}"
                        data-finish-option="${escapeHtml(acabado.nombre)}"
                        aria-pressed="${acabado.nombre === selectedFinish}"
                      >
                        <span class="variant-swatch" style="background-color: ${escapeHtml(acabado.hex)};"></span>
                        <span>${escapeHtml(acabado.nombre)}</span>
                      </button>
                    `,
                  )
                  .join('')}
              </div>
            </div>

            <div class="pdp-actions">
              <div class="stepper" aria-label="Selector de cantidad">
                <button type="button" class="stepper__btn" data-qty-step="-1" aria-label="Reducir cantidad" ${outOfStock ? 'disabled' : ''}>−</button>
                <span class="stepper__value" data-qty-value>${quantity}</span>
                <button type="button" class="stepper__btn" data-qty-step="1" aria-label="Aumentar cantidad" ${outOfStock ? 'disabled' : ''}>+</button>
              </div>

              <button type="button" class="btn btn--primary" data-pdp-add ${outOfStock ? 'disabled' : ''}>
                ${outOfStock ? 'Sin existencias' : 'Agregar al carrito'}
              </button>

              <button type="button" class="btn btn--secondary" data-pdp-fav aria-pressed="${favActive}">
                ${favActive ? 'En favoritos' : 'Guardar en favoritos'}
              </button>
            </div>

            <dl class="specs-table" aria-label="Especificaciones técnicas">
              ${specsRows}
            </dl>
          </div>
        </div>
      `;

      const stage = rootEl.querySelector('[data-pdp-stage]');
      rootEl.querySelectorAll('[data-stage-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const mode = btn.getAttribute('data-stage-mode');
          stage.classList.toggle('is-technical', mode === 'technical');
          rootEl.querySelectorAll('[data-stage-mode]').forEach((el) => {
            el.classList.toggle('is-active', el === btn);
          });
        });
      });

      rootEl.querySelectorAll('[data-finish-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedFinish = btn.getAttribute('data-finish-option');
          const label = rootEl.querySelector('[data-selected-finish]');
          if (label) label.textContent = selectedFinish;
          rootEl.querySelectorAll('[data-finish-option]').forEach((el) => {
            const active = el === btn;
            el.classList.toggle('is-selected', active);
            el.setAttribute('aria-pressed', String(active));
          });
        });
      });

      rootEl.querySelectorAll('[data-qty-step]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const step = Number(btn.getAttribute('data-qty-step'));
          quantity = Math.max(1, Math.min(product.stock, quantity + step));
          const valEl = rootEl.querySelector('[data-qty-value]');
          if (valEl) valEl.textContent = String(quantity);
        });
      });

      const addBtn = rootEl.querySelector('[data-pdp-add]');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          addToCart(product, quantity, selectedFinish);
        });
      }

      const favBtn = rootEl.querySelector('[data-pdp-fav]');
      if (favBtn) {
        favBtn.addEventListener('click', () => {
          const active = toggleFavorite(product.id, product.nombre);
          favBtn.setAttribute('aria-pressed', String(active));
          favBtn.textContent = active ? 'En favoritos' : 'Guardar en favoritos';
        });
      }
    };

    renderPdp();

    if (relatedGrid) {
      const related = products
        .filter((p) => p.id !== product.id)
        .sort((a, b) => Number(b.categoria === product.categoria) - Number(a.categoria === product.categoria))
        .slice(0, 3);
      relatedGrid.innerHTML = related.map(renderProductCard).join('');
      bindProductGridActions(relatedGrid, products);
    }
  } catch (error) {
    rootEl.innerHTML = `
      <div class="empty-state">
        <h1 class="empty-state__title">No se pudo cargar el producto</h1>
        <p class="empty-state__text">${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initProductPage);
