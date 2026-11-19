# Mica Fuentes — Portfolio

Portfolio de Mica Fuentes, diseñadora UX/UI. Sitio estático: HTML, CSS y JavaScript, sin build ni dependencias.

## Estructura

```
index.html          → todo el sitio (estilos y script incluidos)
img/                → portadas de los trabajos (.webp)
proyectos/          → demos programadas que se abren desde el portfolio
  vigente/          → Vigente (web, mobile y reloj)
  app-entrena/      → App de entrenamiento (build de Vite)
  lo-que-dice/      → Landing "Lo que dice y lo que hace"
```

## Cargar o editar trabajos

Todos los trabajos están en el array `WORKS` dentro de `index.html`. Cada uno tiene título, año, categorías (la primera es la principal), imagen, textos, rol, equipo y links. Para ocultar uno sin borrarlo: `hidden: true`.

## Publicación

Se sirve con GitHub Pages desde la rama `main`, carpeta raíz.

### Dominio propio

1. Agregar un archivo `CNAME` en la raíz con el dominio (por ejemplo `micafuentes.com`).
2. En el proveedor del dominio:
   - Dominio raíz: registros A a `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`.
   - `www`: registro CNAME a `mica-fuentes.github.io`.
3. En Settings → Pages, cargar el dominio y activar "Enforce HTTPS".
