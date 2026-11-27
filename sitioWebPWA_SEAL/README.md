# Módulo Estudio — Catálogo de Diseño Multipágina

Sitio web multipágina de catálogo de productos desarrollado con HTML5 semántico, CSS modular con variables de tema (claro/oscuro) y JavaScript ES Modules, sin frameworks pesados en tiempo de ejecución.

## Estructura del proyecto

```text
.
├── 404.html
├── carrito.html
├── catalogo.html
├── contacto.html
├── index.html
├── producto.html
├── README.md
├── css/
│   ├── base.css
│   ├── components.css
│   ├── pages.css
│   └── variables.css
├── data/
│   └── productos.json
├── img/
│   ├── p1.svg
│   ├── p2.svg
│   ├── p3.svg
│   ├── p4.svg
│   ├── p5.svg
│   ├── p6.svg
│   ├── p7.svg
│   └── p8.svg
└── js/
    ├── carrito.js
    ├── catalogo.js
    ├── contacto.js
    ├── inicio.js
    ├── main.js
    └── producto.js
```

## Funcionalidades principales

- **Varias páginas conectadas**: Portada (`index.html`), catálogo con filtros (`catalogo.html`), ficha de producto (`producto.html?id=...`), carrito y favoritos (`carrito.html`), contacto (`contacto.html`) y página `404.html`.
- **Filtros dinámicos**: Búsqueda instantánea por nombre/material/SKU, pestañas por categoría, control deslizante de precio máximo, filtro de disponibilidad, filtro de favoritos y ordenamiento.
- **Carrito y favoritos persistentes**: Gestión en `localStorage`, control de cantidades, selección de acabados, código promocional (`MODULO10`) y resumen de confirmación de pedido.
- **Modo oscuro**: Cambio inmediato con persistencia en `localStorage` y detección inicial sin parpadeos.
- **Formulario de contacto validado**: Validación en tiempo real y al enviar con mensajes accesibles, contador de caracteres y confirmación de envío.

## Ejecución local

Puedes abrir la carpeta con cualquier servidor estático (por ejemplo `npx serve .` o Live Server) o con Vite (`npm run dev`).
