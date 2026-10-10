# Fluxstore — rediseño del catálogo

Versión nueva de la **interfaz pública**, lista para probar con el catálogo actual. No es necesario instalar React, compilar ni contratar un hosting nuevo: el sitio sigue siendo HTML + CSS + JavaScript estáticos.

## Qué cambió

- Nueva estética clara, profesional y adaptable a celular, tablet y computadora.
- Eliminación de las ventanas modales de sabores y checkout; todo se hace en la misma página.
- Buscador por marca, modelo y sabor (ignora mayúsculas y tildes), filtros de marca y capacidad, opción «Solo disponibles» y orden por precio.
- Fichas compactas con sabores desplegables dentro de cada producto. El selector permite agregar variedades sin abandonar el listado; los sabores sin stock se bloquean.
- Carrito visible al lado del catálogo en escritorio y barra pequeña en la parte inferior del celular. Permite sumar, restar y quitar unidades.
- Checkout integrado en la página, con envío estimado por ciudad, datos más simples y resumen de pedido.
- Paso final de confirmación por WhatsApp, conservando el formato de pedido enviado a Google Apps Script.
- Reseñas en tarjetas con formulario desplegable; se removió el bot flotante que ocupaba la vista.
- Imágenes WebP optimizadas: los recursos del sitio ahora ocupan aprox. 2,4 MB, en vez de más de 28 MB.
- Validación de disponibilidad antes de preparar cada pedido y declaración de mayoría de edad en el formulario.

## Cómo probar

1. Abrí la carpeta en VS Code.
2. Ejecutá `index.html` con **Live Server** o iniciá un servidor local (`python -m http.server 5500`).
3. Abrí la dirección local que muestra tu servidor, por ejemplo `http://localhost:5500`.
4. Probá buscar, elegir sabores, añadir al carrito, modificar cantidades y completar el checkout.

**Importante:** El stock y las reseñas se consultan desde el Apps Script de la versión anterior. Si el servicio no responde o la tabla de sabores no coincide, no se podrá agregar al carrito: es intencional para evitar mostrar disponibilidad inventada.

## Archivos

| Archivo | Función |
| --- | --- |
| `index.html` | Estructura y pantallas de la tienda. |
| `styles.css` | Diseño responsive, colores y componentes. |
| `catalog-data.js` | Lista de modelos, precios, sabores e imágenes. |
| `script.js` | Buscador, filtros, stock, carrito, pedido, WhatsApp y reseñas. |
| `assets/` | Imágenes optimizadas en formato WebP. |

## Datos: qué sigue en Google Sheets y qué no

**La tienda original usa Google Sheets vía Google Apps Script, no lee un `.xlsx` directamente.** Se preservó esa comunicación:

- **Stock de cada sabor:** se consulta en `GOOGLE_SCRIPT_URL` dentro de `script.js`, `?type=stock`, con `productId`, `flavor`, `stock`.
- **Pedidos y reseñas:** se envían por POST al mismo Apps Script, con nombres de campos equivalentes a los de la versión original.
- **Precios, nombres, imágenes y sabores:** siguen declarados en `catalog-data.js`, como en el código anterior. No se extraen automáticamente de la planilla.
- **Costo de envío:** `SHIPPING_PRICES`, en `script.js`.
- **WhatsApp y datos para transferencia:** constantes al inicio de `script.js`.

Para llevar **todo** a tu Excel/Google Sheets y que un cambio de precio o producto se refleje automáticamente sin editar código, hace falta ver la estructura real de las hojas y la función Apps Script. Esa migración **no** forma parte de esta versión.

## Antes de publicarlo (importante)

1. **Probar la conexión real** con el Apps Script existente y verificar la escritura de pedidos, reseñas y el stock en la planilla. En este rediseño se probaron los flujos del navegador con respuestas simuladas, no se crearon pedidos reales.
2. Las peticiones POST usan `no-cors`, como el sistema original. **El navegador no puede comprobar si Google Sheets guardó efectivamente la fila**; por eso la interfaz no afirma que el pedido quedó confirmado y deriva al cliente a WhatsApp. Para confirmación real automática se necesita mejorar el backend para que devuelva una respuesta verificable.
3. **Validar precios, stock y total de cada pedido en el servidor**, no solo en el JavaScript del cliente, y contemplar pedidos simultáneos. La página pública es editable desde el navegador y por sí sola no protege la planilla ni evita sobreventa.
4. **No subir el `admin.html` anterior sin autenticación:** contiene un enlace directo a una planilla de pedidos con datos de clientes. No se incluyó ese archivo en el nuevo sitio publicable; conservás la copia en tu ZIP original.
5. Antes de ofrecer estos productos, **revisar la normativa local aplicable, la verificación de edad y las reglas de venta/publicidad**. Marcar una casilla «soy mayor de 18» no verifica efectivamente la identidad o edad.
6. Revisar precios, costos de envío, texto legal y datos de pago antes de dejarlo accesible al público.

## Pruebas realizadas

- Se verificó la sintaxis JavaScript.
- Se probó en Chromium la carga del catálogo, consulta de stock **simulada**, despliegue de sabores, agregado al carrito, navegación al checkout, cálculo de subtotal y envío, y confirmación del resumen.
- Se probó el diseño en tamaño escritorio y móvil; no se detectó desplazamiento horizontal en la vista móvil probada.

Esta es una base rediseñada y funcional, no una migración del backend ni una instalación en tu hosting en producción.

## Ajuste de visualización del catálogo (10/10/2026)

- Se eliminó el espacio blanco que aparecía en una tarjeta cuando se abría el selector de sabores de la tarjeta contigua.
- En pantallas de escritorio/tablet, las tarjetas ahora se apilan en **dos columnas independientes**. Cada columna tiene su propio flujo, por lo que desplegar sabores no estira ni desplaza hacia abajo las tarjetas de la otra columna.
- En celulares, el catálogo mantiene **una única columna** con el orden normal de productos.
- El botón "Ver y elegir sabores" ahora abre/cierra el listado sin reconstruir todo el catálogo; conserva el foco y evita saltos de pantalla.
- La conexión existente con Google Sheets / Apps Script y la carga de stock no se modificaron.

Archivos con cambios de código: `styles.css` y `script.js`.

## Actualización del logo (10/10/2026)

- Se reemplazó la imagen `assets/fluxstore-logo-circle.webp` por el logo negro con aro neón violeta y azul enviado por la usuaria.
- Se mantiene el nombre del archivo original para que se actualice automáticamente el encabezado, el favicon y el panel `admin.html`, sin cambiar las conexiones, stock, código del catálogo ni el flujo de compra.
- Si el navegador mantiene el logo anterior, hacer una recarga forzada o limpiar la caché.
