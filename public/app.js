(() => {
  const API = '/api/clientes';

  const $ = (id) => document.getElementById(id);
  const tabla = $('tabla');
  const tbody = $('tbody');
  const estado = $('estado');
  const resumen = $('resumen');
  const modal = $('modal');
  const form = $('form');
  const modalTitulo = $('modal-titulo');
  const errorGeneral = $('error-general');
  const btnGuardar = $('btn-guardar');
  const modalEliminar = $('modal-eliminar');
  const eliminarTexto = $('eliminar-texto');
  const errorEliminar = $('error-eliminar');
  const btnEliminarConfirmar = $('btn-eliminar-confirmar');
  const toast = $('toast');

  const CAMPOS = ['nombre', 'email', 'telefono', 'ciudad'];
  const formatoFecha = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

  const clientes = new Map();
  let editandoId = null;
  let eliminandoId = null;
  let toastTimer;

  function celda(texto, clase) {
    const td = document.createElement('td');
    if (clase) td.className = clase;
    if (texto) td.textContent = texto;
    else { td.textContent = '—'; td.classList.add('vacio'); }
    return td;
  }

  function celdaNombre(c) {
    const td = document.createElement('td');
    td.className = 'col-nombre';
    const nombre = document.createElement('span');
    nombre.textContent = c.nombre;
    const correo = document.createElement('span');
    correo.className = 'correo-movil';
    correo.textContent = c.email;
    td.append(nombre, correo);
    return td;
  }

  function botonAccion(accion, texto, etiqueta) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `accion accion-${accion}`;
    b.dataset.accion = accion;
    b.textContent = texto;
    b.setAttribute('aria-label', etiqueta);
    return b;
  }

  function crearFila(c, resaltar = false) {
    const tr = document.createElement('tr');
    tr.dataset.id = c.id;
    if (resaltar) tr.classList.add('resaltada');

    const num = document.createElement('td');
    num.className = 'col-num';
    num.textContent = c.id;

    const acciones = document.createElement('td');
    acciones.className = 'col-acciones';
    const grupo = document.createElement('div');
    grupo.className = 'acciones';
    grupo.append(
      botonAccion('editar', 'Editar', `Editar a ${c.nombre}`),
      botonAccion('eliminar', 'Eliminar', `Eliminar a ${c.nombre}`)
    );
    acciones.append(grupo);

    tr.append(
      num,
      celdaNombre(c),
      celda(c.email, 'col-correo'),
      celda(c.telefono, 'col-secundaria'),
      celda(c.ciudad, 'col-secundaria'),
      celda(formatoFecha.format(new Date(c.creado_en)), 'col-secundaria col-fecha'),
      acciones
    );
    return tr;
  }

  const filaDe = (id) => tbody.querySelector(`tr[data-id="${id}"]`);

  function actualizarResumen() {
    const n = clientes.size;
    resumen.textContent =
      n === 0 ? 'Todavía no hay clientes.' : n === 1 ? '1 cliente registrado' : `${n} clientes registrados`;
  }

  function mostrarEstado(titulo, detalle, accion) {
    estado.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = titulo;
    estado.append(strong, detalle);
    if (accion) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton boton-primario';
      b.textContent = accion.texto;
      b.addEventListener('click', accion.onClick);
      estado.append(b);
    }
    estado.hidden = false;
  }

  function actualizarVacio() {
    if (clientes.size === 0) {
      tabla.hidden = true;
      mostrarEstado('Aún no hay clientes', 'Agrega el primero con el botón “Nuevo cliente”.');
    } else {
      tabla.hidden = false;
      estado.hidden = true;
    }
  }

  async function cargar() {
    resumen.textContent = 'Cargando…';
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const lista = await res.json();
      clientes.clear();
      lista.forEach((c) => clientes.set(c.id, c));
      tbody.replaceChildren(...lista.map((c) => crearFila(c)));
      actualizarResumen();
      actualizarVacio();
    } catch {
      tabla.hidden = true;
      resumen.textContent = 'No se pudo cargar el listado.';
      mostrarEstado('No se pudieron cargar los clientes', 'Comprueba que el servidor esté en marcha e inténtalo de nuevo.', {
        texto: 'Reintentar',
        onClick: cargar,
      });
    }
  }

  function limpiarErrores() {
    errorGeneral.hidden = true;
    errorGeneral.textContent = '';
    CAMPOS.forEach((n) => {
      $(`err-${n}`).textContent = '';
      form.elements[n].removeAttribute('aria-invalid');
    });
  }

  function mostrarErrores(campos = {}, general) {
    limpiarErrores();
    let primero = null;
    for (const [nombre, msg] of Object.entries(campos)) {
      const input = form.elements[nombre];
      if (!input) continue;
      input.setAttribute('aria-invalid', 'true');
      $(`err-${nombre}`).textContent = msg;
      primero = primero || input;
    }
    if (general && !primero) {
      errorGeneral.textContent = general;
      errorGeneral.hidden = false;
    }
    if (primero) primero.focus();
  }

  const textoGuardar = () => (editandoId === null ? 'Guardar cliente' : 'Guardar cambios');

  function abrirNuevo() {
    editandoId = null;
    form.reset();
    limpiarErrores();
    modalTitulo.textContent = 'Nuevo cliente';
    btnGuardar.textContent = textoGuardar();
    modal.showModal();
    form.elements.nombre.focus();
  }

  function abrirEditar(id) {
    const c = clientes.get(id);
    if (!c) return;
    editandoId = id;
    form.reset();
    limpiarErrores();
    CAMPOS.forEach((n) => { form.elements[n].value = c[n] ?? ''; });
    modalTitulo.textContent = 'Editar cliente';
    btnGuardar.textContent = textoGuardar();
    modal.showModal();
    form.elements.nombre.focus();
    form.elements.nombre.select();
  }

  function validarLocal(datos) {
    const errores = {};
    if (datos.nombre.trim().length < 2) errores.nombre = 'Escribe el nombre (mínimo 2 caracteres).';
    if (!datos.email.trim()) errores.email = 'Escribe el correo electrónico.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.email.trim()))
      errores.email = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
    if (datos.telefono.trim() && !/^[0-9+()\-\s]{6,20}$/.test(datos.telefono.trim()))
      errores.telefono = 'Usa solo números, espacios, +, - y paréntesis (6 a 20 caracteres).';
    return errores;
  }

  async function guardar(e) {
    e.preventDefault();
    const datos = Object.fromEntries(CAMPOS.map((n) => [n, form.elements[n].value]));

    const erroresLocales = validarLocal(datos);
    if (Object.keys(erroresLocales).length) return mostrarErrores(erroresLocales);

    const editando = editandoId !== null;
    const id = editandoId;

    limpiarErrores();
    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando…';

    try {
      const res = await fetch(editando ? `${API}/${id}` : API, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const cuerpo = await res.json().catch(() => ({}));

      if (res.status === 404 && editando) {
        modal.close();
        await cargar();
        avisar('Ese cliente ya no existe. Actualizamos la lista.');
        return;
      }
      if (!res.ok) {
        mostrarErrores(cuerpo.campos, cuerpo.error || 'No se pudo guardar el cliente. Inténtalo de nuevo.');
        return;
      }

      clientes.set(cuerpo.id, cuerpo);
      modal.close();
      if (editando) {
        const nueva = crearFila(cuerpo, true);
        filaDe(id).replaceWith(nueva);
        nueva.querySelector('[data-accion="editar"]').focus();
        avisar('Cambios guardados');
      } else {
        tbody.prepend(crearFila(cuerpo, true));
        avisar('Cliente guardado');
      }
      actualizarResumen();
      actualizarVacio();
    } catch {
      mostrarErrores({}, 'No hay conexión con el servidor. Comprueba que esté en marcha e inténtalo de nuevo.');
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = textoGuardar();
    }
  }

  function abrirEliminar(id) {
    const c = clientes.get(id);
    if (!c) return;
    eliminandoId = id;
    eliminarTexto.textContent = `Se eliminará a ${c.nombre} (${c.email}). Esta acción no se puede deshacer.`;
    errorEliminar.hidden = true;
    errorEliminar.textContent = '';
    modalEliminar.showModal();
  }

  async function confirmarEliminar() {
    const id = eliminandoId;
    if (id === null) return;

    btnEliminarConfirmar.disabled = true;
    btnEliminarConfirmar.textContent = 'Eliminando…';

    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const cuerpo = await res.json().catch(() => ({}));
        errorEliminar.textContent = cuerpo.error || 'No se pudo eliminar el cliente. Inténtalo de nuevo.';
        errorEliminar.hidden = false;
        return;
      }

      const fila = filaDe(id);
      const vecina = fila ? fila.nextElementSibling || fila.previousElementSibling : null;
      modalEliminar.close();
      fila?.remove();
      clientes.delete(id);
      eliminandoId = null;
      actualizarResumen();
      actualizarVacio();
      (vecina?.querySelector('button') || $('btn-nuevo')).focus();
      avisar('Cliente eliminado');
    } catch {
      errorEliminar.textContent = 'No hay conexión con el servidor. Comprueba que esté en marcha e inténtalo de nuevo.';
      errorEliminar.hidden = false;
    } finally {
      btnEliminarConfirmar.disabled = false;
      btnEliminarConfirmar.textContent = 'Eliminar';
    }
  }

  function avisar(texto) {
    toast.textContent = texto;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 3000);
  }

  $('btn-nuevo').addEventListener('click', abrirNuevo);
  $('btn-cerrar').addEventListener('click', () => modal.close());
  $('btn-cancelar').addEventListener('click', () => modal.close());
  form.addEventListener('submit', guardar);

  $('btn-eliminar-cancelar').addEventListener('click', () => modalEliminar.close());
  btnEliminarConfirmar.addEventListener('click', confirmarEliminar);

  tbody.addEventListener('click', (e) => {
    const boton = e.target.closest('button[data-accion]');
    if (!boton) return;
    const id = Number(boton.closest('tr').dataset.id);
    if (boton.dataset.accion === 'editar') abrirEditar(id);
    else abrirEliminar(id);
  });

  function cerrarAlClicarFuera(dialogo) {
    let empezoFuera = false;
    dialogo.addEventListener('mousedown', (e) => { empezoFuera = e.target === dialogo; });
    dialogo.addEventListener('click', (e) => {
      if (e.target === dialogo && empezoFuera) dialogo.close();
    });
  }
  cerrarAlClicarFuera(modal);
  cerrarAlClicarFuera(modalEliminar);

  cargar();
})();
