import {
  bindProductGridActions,
  escapeHtml,
  loadProducts,
  renderProductCard,
} from './main.js';

async function initHomePage() {
  const featuredContainer = document.querySelector('[data-featured-grid]');
  const categoryContainer = document.querySelector('[data-category-counts]');

  if (!featuredContainer) return;

  try {
    const products = await loadProducts();
    const featured = products.filter((p) => p.destacado).slice(0, 3);

    featuredContainer.innerHTML = featured.map(renderProductCard).join('');
    bindProductGridActions(featuredContainer, products);

    if (categoryContainer) {
      const categories = ['Iluminación', 'Mobiliario', 'Audio', 'Objetos'];
      categoryContainer.innerHTML = categories
        .map((cat) => {
          const count = products.filter((p) => p.categoria === cat).length;
          return `
            <a class="category-tile" href="catalogo.html?categoria=${encodeURIComponent(cat)}">
              <span>${escapeHtml(cat)}</span>
              <span class="category-tile__count">${count} piezas</span>
            </a>
          `;
        })
        .join('');
    }
  } catch (error) {
    featuredContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <h3 class="empty-state__title">No se pudo cargar la selección</h3>
        <p class="empty-state__text">${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initHomePage);
