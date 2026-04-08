# PetZone - Backend API

API REST para la tienda de productos veterinarios PetZone. Construida con Node.js, Express y MongoDB.

## Instalación

```bash
cd Backend
npm install
```

Crear un archivo `.env` basado en `.env.example`:

```
MONGODB_URI="tu_uri_de_mongodb"
JWT_SECRET="yo_se_las_paso"
```

Iniciar el servidor:

```bash
node server.js
```

El servidor corre en `http://localhost:3000` por defecto.

---

## Modelos de datos

| Modelo | Descripción |
|---|---|
| **Usuario** | Usuarios con autenticación (cliente/admin) |
| **Categoria** | Categorías de productos |
| **Producto** | Productos de la tienda |
| **Carrito** | Carrito de compras por usuario |
| **Orden** | Órdenes de compra |

---

## Endpoints

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/registro` | Registrar usuario | No |
| POST | `/api/auth/login` | Iniciar sesión | No |
| GET | `/api/auth/perfil` | Ver perfil actual | Sí |

**Registro** - Body:
```json
{ "nombre": "...", "username": "...", "email": "...", "password": "...", "cedula": "..." }
```

**Login** - Body (acepta email o username en el campo `login`):
```json
{ "login": "email_o_username", "password": "..." }
```

---

### Usuarios (`/api/usuarios`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/usuarios` | Listar todos los usuarios | Admin |
| GET | `/api/usuarios/:id` | Obtener usuario por ID | Sí |
| PUT | `/api/usuarios/:id` | Actualizar usuario | Sí (propio o admin) |
| DELETE | `/api/usuarios/:id` | Eliminar usuario | Admin |

**Actualizar usuario** — Body (campos opcionales): `nombre`, `email`, `cedula`. El campo **`rol`** (`cliente` \| `admin`) solo lo puede enviar un **admin**; un cliente no puede cambiar su propio rol ni el de nadie.

---

### Categorías (`/api/categorias`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/categorias` | Listar categorías | No |
| GET | `/api/categorias/:id` | Obtener categoría | No |
| POST | `/api/categorias` | Crear categoría | Admin |
| PUT | `/api/categorias/:id` | Actualizar categoría | Admin |
| DELETE | `/api/categorias/:id` | Eliminar categoría | Admin |

---

### Productos (`/api/productos`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/productos` | Listar productos | No |
| GET | `/api/productos/:id` | Obtener producto | No |
| POST | `/api/productos` | Crear producto | Admin |
| PUT | `/api/productos/:id` | Actualizar producto | Admin |
| DELETE | `/api/productos/:id` | Eliminar producto (soft delete) | Admin |

**Query params** para GET `/api/productos`:
- `categoria` - filtrar por ID de categoría
- `busqueda` - buscar por nombre o descripción

**Crear producto** - Body:
```json
{
  "nombre": "...",
  "categoriaId": "id_categoria",
  "precio": 11702, "descripcion": "...",
  "imagen": "imagen.png", "stock": 50
}
```

---

### Carrito (`/api/carrito`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/carrito` | Ver carrito del usuario | Sí |
| POST | `/api/carrito/agregar` | Agregar producto al carrito | Sí |
| PUT | `/api/carrito/actualizar` | Actualizar cantidad | Sí |
| DELETE | `/api/carrito/eliminar/:productoId` | Eliminar producto del carrito | Sí |
| DELETE | `/api/carrito/vaciar` | Vaciar carrito | Sí |

**Agregar al carrito** - Body:
```json
{ "productoId": "id_producto", "cantidad": 2 }
```

---

### Órdenes (`/api/ordenes`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/ordenes` | Crear orden desde el carrito (sin body); descuenta stock | Sí |
| GET | `/api/ordenes/mis-ordenes` | Ver mis órdenes | Sí |
| GET | `/api/ordenes/:id` | Ver detalle de orden | Sí (propia o admin) |
| GET | `/api/ordenes` | Listar todas las órdenes | Admin |
| PUT | `/api/ordenes/:id/estado` | Cambiar estado de orden | Admin |

**Crear orden** — no envía body. Se descuenta stock por cada línea (`$inc` negativo), se guarda la orden y se vacía el carrito. Si un producto del carrito ya no existe en catálogo, responde **400**. El comprobante de pago lo coordina el cliente por los medios que muestre el frontend; el admin actualiza el estado al verificarlo.

**Cambiar estado** - Body:
```json
{ "estado": "PAGADO" }
```

Estados disponibles: `PENDIENTE`, `PAGADO`, `ENVIADO`, `ENTREGADO`, `CANCELADO`

Si el nuevo estado es `CANCELADO` y la orden **no** estaba ya cancelada, se suma de vuelta el stock de cada línea y luego se guarda el estado. Volver a marcar como cancelada no duplica la devolución.

---

## Flujo de compra

1. El usuario se registra/inicia sesión y obtiene un token JWT
2. Agrega productos al carrito (`POST /api/carrito/agregar`)
3. Crea una orden desde el carrito (`POST /api/ordenes`, sin body) — el carrito se vacía automáticamente
4. La orden queda en `PENDIENTE`. En la página se indica cómo enviar el comprobante (teléfono, correo, etc.) fuera de la API
5. El admin revisa las órdenes y cambia el estado (por ejemplo a `PAGADO`) con `PUT /api/ordenes/:id/estado`

## Autenticación

Todas las rutas protegidas requieren el header:

```
Authorization: Bearer <token_jwt>
```

El token se obtiene al registrarse o iniciar sesión.

### Uso del token (frontend)

1. Tras `POST /api/auth/login` o `POST /api/auth/registro`, guarda el string `token` de la respuesta (por ejemplo `localStorage.setItem('token', data.token)`).
2. En cada petición a rutas que exigen auth, envía el header **`Authorization`** con el valor **`Bearer `** + el token (un espacio después de `Bearer`). Ejemplo con `fetch`:

```javascript
const token = localStorage.getItem('token');

const res = await fetch(`${API_URL}/api/carrito`, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
});
```
