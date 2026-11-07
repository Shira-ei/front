# Clientes: tabla con modal para crear, editar y eliminar

Front con tabla y formularios modales, y backend en Node.js con Express y MySQL (el de XAMPP).
Los datos se pueden ver y editar desde phpMyAdmin.

## Requisitos

- Node.js 18 o superior (`node -v` para comprobarlo).
- XAMPP con MySQL iniciado.

## Cómo ejecutarlo

1. Abre el panel de control de XAMPP y pulsa **Start** en **MySQL**. Para usar phpMyAdmin inicia también **Apache**.
2. En una terminal, dentro de la carpeta del proyecto (donde está `package.json`):

   ```
   npm install
   npm start
   ```

3. Abre http://localhost:3000.

La primera vez, la aplicación crea sola la base de datos `clientes_db` y la tabla `clientes`.
Para desarrollo con recarga automática: `npm run dev`.

## Ver los datos en phpMyAdmin

Con Apache y MySQL iniciados, abre http://localhost/phpmyadmin, elige `clientes_db` en la lista de la izquierda y haz clic en la tabla `clientes`.

## Configuración

Por defecto usa la instalación estándar de XAMPP: host `127.0.0.1`, puerto `3306`, usuario `root`, sin contraseña, base `clientes_db`.
Si algo es distinto en tu equipo, cámbialo con variables de entorno antes de `npm start`:

| Variable      | Por defecto  | Para qué                              |
|---------------|--------------|---------------------------------------|
| `DB_HOST`     | `127.0.0.1`  | Dirección de MySQL                    |
| `DB_PORT`     | `3306`       | Puerto (en XAMPP a veces es `3307`)   |
| `DB_USER`     | `root`       | Usuario                               |
| `DB_PASSWORD` | (vacía)      | Contraseña                            |
| `DB_NAME`     | `clientes_db`| Nombre de la base de datos            |
| `PORT`        | `3000`       | Puerto de esta aplicación             |

En `cmd` de Windows: `set DB_PASSWORD=mi_clave` y después `npm start`.
En PowerShell: `$env:DB_PASSWORD="mi_clave"` y después `npm start`.

Si prefieres crear la base a mano, `schema.sql` tiene las mismas sentencias: en phpMyAdmin, pestaña **Importar**.

## Errores comunes

- **No se pudo conectar a MySQL:** MySQL no está iniciado en XAMPP, o usa otro puerto (`DB_PORT`).
- **MySQL rechazó el usuario o la contraseña:** revisa `DB_USER` y `DB_PASSWORD`.
- **Cannot find module 'express' o 'mysql2':** falta ejecutar `npm install`.
- **npm no encuentra package.json:** no estás dentro de la carpeta del proyecto.

## Endpoints

| Método | Ruta                | Descripción                                    | Respuestas                              |
|--------|---------------------|------------------------------------------------|-----------------------------------------|
| GET    | `/api/clientes`     | Lista los clientes, del más nuevo al más viejo | 200                                     |
| POST   | `/api/clientes`     | Crea un cliente                                | 201, 400 (datos), 409 (correo repetido) |
| GET    | `/api/clientes/:id` | Devuelve un cliente                            | 200, 400 (id), 404                      |
| PUT    | `/api/clientes/:id` | Actualiza todos los datos de un cliente        | 200, 400 (id o datos), 404, 409         |
| DELETE | `/api/clientes/:id` | Elimina un cliente                             | 204, 400 (id), 404                      |

Cuerpo de POST y PUT (JSON):

```json
{ "nombre": "Ana López", "email": "ana@correo.com", "telefono": "5555-1234", "ciudad": "Huehuetenango" }
```

`nombre` y `email` son obligatorios; `telefono` y `ciudad` son opcionales.
Los errores de validación llegan como `{ "error": "...", "campos": { "email": "..." } }`
y el front los muestra bajo cada campo. Un método no permitido responde 405 con la cabecera `Allow`.

## Estructura

```
├── server.js        Express: rutas de la API, archivos estáticos, errores y arranque
├── db.js            conexión a MySQL (mysql2), creación de la base/tabla y consultas
├── validacion.js    reglas de validación (las usan POST y PUT)
├── schema.sql       las mismas sentencias de creación, por si prefieres importarlas a mano
├── package.json
└── public/
    ├── index.html   tabla, modal de crear/editar y confirmación de eliminar
    ├── styles.css
    └── app.js       llamadas a la API y render de la tabla
```

Todo el acceso a datos está en `db.js` (listar, obtener, crear, actualizar y eliminar).
