import {
  bindProductGridActions,
  escapeHtml,
  formatPrice,
  getFavorites,
  loadProducts,
  renderProductCard,
} from './main.js';

const state = {
  search: '',
  categoria: 'Todas',
  maxPrice: 1000,
  onlyInStock: false,
  onlyFavorites: false,
  sort: 'destacados',
};

function readInitialParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('categoria');
  const q = params.get('q');
  const fav = params.get('favoritos');

  if (cat) state.categoria = cat;
  if (q) state.search = q;
  if (fav === '1') state.onlyFavorites = true;
}

function applyFilters(products) {
  const query = state.search.trim().toLowerCase();
  const favIds = getFavorites();

  const filtered = products.filter((item) => {
    if (state.categoria !== 'Todas' && item.categoria !== state.categoria) {
      return false;
    }
    if (item.precio > state.maxPrice) {
      return false;
    }
    if (state.onlyInStock && item.stock <= 0) {
      return false;
    }
    if (state.onlyFavorites && !favIds.includes(item.id)) {
      return false;
    }
    if (query) {
      const haystack = [
        item.nombre,
        item.categoria,
        item.sku,
        item.descripcionCorta,
        item.especificaciones?.material || '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  if (state.sort === 'precio-asc') {
    sorted.sort((a, b) => a.precio - b.precio);
  } else if (state.sort === 'precio-desc') {
    sorted.sort((a, b) => b.precio - a.precio);
  } else if (state.sort === 'nombre-asc') {
    sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  } else {
    sorted.sort((a, b) => Number(b.destacado) - Number(a.destacado));
  }

  return sorted;
}

async function initCatalogPage() {
  const gridEl = document.querySelector('[data-catalog-grid]');
  const countEl = document.querySelector('[data-results-count]');
  const searchInput = document.querySelector('[data-filter-search]');
  const clearSearchBtn = document.querySelector('[data-clear-search]');
  const categoryTabs = document.querySelectorAll('[data-filter-category]');
  const priceRange = document.querySelector('[data-filter-price]');
  const priceOutput = document.querySelector('[data-price-value]');
  const sortSelect = document.querySelector('[data-filter-sort]');
  const stockBtn = document.querySelector('[data-filter-stock]');
  const favBtn = document.querySelector('[data-filter-favorites]');

  if (!gridEl) return;

  readInitialParams();

  try {
    const products = await loadProducts();
    const maxCatalogPrice = Math.max(...products.map((p) => p.precio), 1000);
    state.maxPrice = maxCatalogPrice;

    if (priceRange) {
      priceRange.max = String(maxCatalogPrice);
      priceRange.value = String(maxCatalogPrice);
    }

    const syncControls = () => {
      if (searchInput) searchInput.value = state.search;
      if (clearSearchBtn) clearSearchBtn.hidden = state.search.length === 0;
      if (priceRange) priceRange.value = String(state.maxPrice);
      if (priceOutput) priceOutput.textContent = formatPrice(state.maxPrice);
      if (sortSelect) sortSelect.value = state.sort;

      categoryTabs.forEach((tab) => {
        const active = tab.getAttribute('data-filter-category') === state.categoria;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-pressed', String(active));
      });

      if (stockBtn) {
        stockBtn.classList.toggle('is-active', state.onlyInStock);
        stockBtn.setAttribute('aria-pressed', String(state.onlyInStock));
      }

      if (favBtn) {
        favBtn.classList.toggle('is-active', state.onlyFavorites);
        favBtn.setAttribute('aria-pressed', String(state.onlyFavorites));
      }
    };

    const render = () => {
      const results = applyFilters(products);
      if (countEl) {
        countEl.textContent = `Mostrando ${results.length} de ${products.length} piezas`;
      }

      if (results.length === 0) {
        gridEl.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <h3 class="empty-state__title">Sin coincidencias para estos filtros</h3>
            <p class="empty-state__text">
              Ajusta el rango de precio, cambia de categoría o limpia la búsqueda para ver todas las piezas disponibles.
            </p>
            <button type="button" class="btn btn--primary" data-reset-filters>
              Restablecer filtros
            </button>
          </div>
        `;
        const resetBtn = gridEl.querySelector('[data-reset-filters]');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            state.search = '';
            state.categoria = 'Todas';
            state.maxPrice = maxCatalogPrice;
            state.onlyInStock = false;
            state.onlyFavorites = false;
            state.sort = 'destacados';
            syncControls();
            render();
          });
        }
        return;
      }

      gridEl.innerHTML = results.map(renderProductCard).join('');
    };

    bindProductGridActions(gridEl, products);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        if (clearSearchBtn) clearSearchBtn.hidden = state.search.length === 0;
        render();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        state.search = '';
        syncControls();
        render();
        searchInput?.focus();
      });
    }

    categoryTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        state.categoria = tab.getAttribute('data-filter-category') || 'Todas';
        syncControls();
        render();
      });
    });

    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        state.maxPrice = Number(e.target.value);
        if (priceOutput) priceOutput.textContent = formatPrice(state.maxPrice);
        render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        render();
      });
    }

    if (stockBtn) {
      stockBtn.addEventListener('click', () => {
        state.onlyInStock = !state.onlyInStock;
        syncControls();
        render();
      });
    }

    if (favBtn) {
      favBtn.addEventListener('click', () => {
        state.onlyFavorites = !state.onlyFavorites;
        syncControls();
        render();
      });
    }

    window.addEventListener('favorites:updated', () => {
      if (state.onlyFavorites) render();
    });

    syncControls();
    render();
  } catch (error) {
    gridEl.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3 class="empty-state__title">Error al cargar el catálogo</h3>
        <p class="empty-state__text">${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initCatalogPage);
