const path = require('node:path');
const express = require('express');
const db = require('./db');
const { validarCliente } = require('./validacion');

const { listarClientes, obtenerCliente, crearCliente, actualizarCliente, eliminarCliente } = db;

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function leerCliente(req, res) {
  if (!esObjeto(req.body)) {
    res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON.' });
    return null;
  }
  const { campos, datos } = validarCliente(req.body);
  if (Object.keys(campos).length) {
    res.status(400).json({ error: 'Revisa los datos del formulario.', campos });
    return null;
  }
  return datos;
}

function responderErrorBD(res, err) {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Ya existe un cliente con ese correo.',
      campos: { email: 'Ya hay un cliente registrado con este correo.' },
    });
  }
  throw err;
}

const metodoNoPermitido = (permitidos) => (req, res) => {
  res.set('Allow', permitidos);
  res.status(405).json({ error: 'Método no permitido.' });
};

const api = express.Router();

api.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

api.param('id', (req, res, next, valor) => {
  if (!/^[1-9]\d{0,9}$/.test(valor)) {
    return res.status(400).json({ error: 'El id debe ser un número entero positivo.' });
  }
  req.clienteId = Number(valor);
  next();
});

api
  .route('/clientes')
  .get(async (req, res) => {
    res.json(await listarClientes());
  })
  .post(async (req, res) => {
    const datos = leerCliente(req, res);
    if (!datos) return;
    try {
      const nuevo = await crearCliente(datos);
      res.status(201).location(`/api/clientes/${nuevo.id}`).json(nuevo);
    } catch (err) {
      responderErrorBD(res, err);
    }
  })
  .all(metodoNoPermitido('GET, POST'));

api
  .route('/clientes/:id')
  .get(async (req, res) => {
    const cliente = await obtenerCliente(req.clienteId);
    if (!cliente) return res.status(404).json({ error: 'El cliente no existe.' });
    res.json(cliente);
  })
  .put(async (req, res) => {
    const datos = leerCliente(req, res);
    if (!datos) return;
    try {
      const actualizado = await actualizarCliente(req.clienteId, datos);
      if (!actualizado) return res.status(404).json({ error: 'El cliente no existe.' });
      res.json(actualizado);
    } catch (err) {
      responderErrorBD(res, err);
    }
  })
  .delete(async (req, res) => {
    if (!(await eliminarCliente(req.clienteId))) {
      return res.status(404).json({ error: 'El cliente no existe.' });
    }
    res.status(204).end();
  })
  .all(metodoNoPermitido('GET, PUT, DELETE'));

api.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use('/api', api);

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo debe ser un JSON válido.' });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'Solicitud no válida.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

function describirErrorBD(err) {
  switch (err.code) {
    case 'ECONNREFUSED':
      return `No se pudo conectar a MySQL en ${db.destino}.\n` +
        'Abre el panel de control de XAMPP y pulsa "Start" en MySQL. ' +
        'Si MySQL usa otro puerto, indícalo con la variable DB_PORT.';
    case 'ER_ACCESS_DENIED_ERROR':
      return 'MySQL rechazó el usuario o la contraseña. ' +
        'Revisa las variables DB_USER y DB_PASSWORD (en XAMPP: usuario root, sin contraseña).';
    default:
      return `No se pudo preparar la base de datos: ${err.message}`;
  }
}

async function arrancar() {
  try {
    await db.iniciar();
  } catch (err) {
    console.error(`\n${describirErrorBD(err)}\n`);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Base de datos "${db.nombreBD}" lista en ${db.destino}`);
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
}

if (require.main === module) arrancar();

module.exports = app;
