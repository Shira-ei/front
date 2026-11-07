const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_TELEFONO = /^[0-9+()\-\s]{6,20}$/;

function validarCliente(entrada) {
  const campos = {};
  const texto = (v) => (typeof v === 'string' ? v.trim() : '');

  const nombre = texto(entrada.nombre);
  const email = texto(entrada.email).toLowerCase();
  const telefono = texto(entrada.telefono);
  const ciudad = texto(entrada.ciudad);

  if (nombre.length < 2) campos.nombre = 'Escribe el nombre (mínimo 2 caracteres).';
  else if (nombre.length > 100) campos.nombre = 'El nombre no puede pasar de 100 caracteres.';

  if (!email) campos.email = 'Escribe el correo electrónico.';
  else if (email.length > 150 || !RE_EMAIL.test(email))
    campos.email = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';

  if (telefono && !RE_TELEFONO.test(telefono))
    campos.telefono = 'Usa solo números, espacios, +, - y paréntesis (6 a 20 caracteres).';

  if (ciudad.length > 80) campos.ciudad = 'La ciudad no puede pasar de 80 caracteres.';

  return { campos, datos: { nombre, email, telefono, ciudad } };
}

module.exports = { validarCliente };
