/**
 * Fragmentación de políticas por sección y punto (sin modelo de embeddings).
 *
 * Acepta el texto que devuelve Drive para cada formato:
 *   - Google Doc (exportado a Markdown): encabezados "## **1\. Título**", negritas, metadatos en citas ">".
 *   - PDF (texto extraído): secciones "1. Título" sin almohadilla, metadatos "Versión: 2.1".
 *
 * Un fragmento por punto numerado ("1.1.") dentro de su sección. Cada fragmento conserva:
 * código de política, versión, sección, punto, drive_file_id y el bloque de metadatos del documento.
 * Las marcas "[Por validar...]" se conservan tal cual y el fragmento lo indica.
 * Las filas del calendario se indexan una por una.
 */

const RE_SECCION = /^(#{1,6}\s+)?(\d+)\.\s+(.+)$/;
const RE_PUNTO = /^(\d+)\.(\d+)\.\s+(.*)$/;
const RE_METADATO = /^([A-Za-zÁÉÍÓÚáéíóúñ ]{3,30}):\s*(.+)$/;
const RE_POR_VALIDAR = /\[Por validar[^\]]*\]/i;

/** Quita el formato de Google Docs que no aporta texto: negritas, escapes de punto y citas. */
function normalizarLinea(linea) {
  return linea
    .replace(/\\\./g, '.')          // "1\." -> "1."
    .replace(/\*\*/g, '')           // negritas
    .replace(/^>\s*/, '')           // citas de los metadatos
    .replace(/^\*\s+(?=\S)/, '- ')  // viñetas "* " -> "- "
    .trimEnd();
}

/** Parsea CSV simple (sin comillas multilínea): suficiente para calendario-2026.csv. */
export function parsearCsv(texto) {
  const [cabecera, ...filas] = texto.trim().split(/\r?\n/);
  const columnas = cabecera.split(',').map((c) => c.trim());
  return filas
    .filter((f) => f.trim() !== '')
    .map((f) => {
      const valores = f.split(',');
      const fila = {};
      columnas.forEach((col, i) => {
        // La última columna puede contener comas: se vuelve a unir
        fila[col] = i === columnas.length - 1 ? valores.slice(i).join(',').trim() : (valores[i] ?? '').trim();
      });
      return fila;
    });
}

/** Fragmentos del calendario: una fila por fragmento. */
export function fragmentosCalendario(texto, metadatos) {
  return parsearCsv(texto).map((fila, i) => ({
    ...metadatos,
    tipo_fragmento: 'calendario',
    seccion: null,
    seccion_titulo: null,
    punto: null,
    metadatos_documento: null,
    orden: i + 1,
    contenido: `${fila.fecha} · ${fila.tipo} · ${fila.descripcion} · estado: ${fila.estado_verificacion}`,
    fila,
    por_validar: /por validar/i.test(fila.estado_verificacion ?? ''),
  }));
}

/** Fragmentos de una política (Markdown de Google Docs o texto de PDF). */
export function fragmentosPolitica(textoOriginal, metadatos) {
  const lineas = textoOriginal.split(/\r?\n/).map(normalizarLinea);

  // Bloque de metadatos: líneas "Clave: valor" o "- Clave: valor" antes de la primera sección
  const metadatosDocumento = [];
  let seccion = null;
  let tituloSeccion = null;
  let ultimaSeccion = 0;
  let puntoActual = null;
  const fragmentos = [];

  // Texto de una sección que no está bajo ningún punto (p. ej. tablas): se guarda como fragmento de sección
  let textoSuelto = [];

  const cerrarPunto = () => {
    if (puntoActual) {
      fragmentos.push({ ...puntoActual, contenido: puntoActual.partes.join(' ').replace(/\s+/g, ' ').trim() });
      puntoActual = null;
    }
  };

  const cerrarSuelto = () => {
    const contenido = textoSuelto.join(' ').replace(/\s+/g, ' ').trim();
    if (contenido && seccion !== null) {
      fragmentos.push({
        ...metadatos,
        tipo_fragmento: 'seccion',
        seccion,
        seccion_titulo: tituloSeccion,
        punto: null,
        metadatos_documento: metadatosDocumento.join('\n'),
        contenido,
      });
    }
    textoSuelto = [];
  };

  for (const linea of lineas) {
    const sinViñeta = linea.replace(/^-\s+/, '');
    const seccionMatch = linea.match(RE_SECCION);
    const puntoMatch = linea.match(RE_PUNTO);

    // Sección: con almohadilla, o sin ella si es la siguiente en la numeración (evita falsos positivos)
    if (seccionMatch && !puntoMatch) {
      const conAlmohadilla = Boolean(seccionMatch[1]);
      const numero = Number(seccionMatch[2]);
      if (conAlmohadilla || numero === ultimaSeccion + 1) {
        cerrarPunto();
        cerrarSuelto();
        seccion = numero;
        ultimaSeccion = numero;
        tituloSeccion = seccionMatch[3].trim();
        continue;
      }
    }

    if (puntoMatch && seccion !== null) {
      cerrarPunto();
      cerrarSuelto();
      puntoActual = {
        ...metadatos,
        tipo_fragmento: 'punto',
        seccion,
        seccion_titulo: tituloSeccion,
        punto: `${puntoMatch[1]}.${puntoMatch[2]}`,
        metadatos_documento: metadatosDocumento.join('\n'),
        partes: [puntoMatch[3]],
      };
      continue;
    }

    if (seccion === null) {
      // Antes de la primera sección: encabezado del documento y metadatos
      const meta = sinViñeta.match(RE_METADATO);
      if (meta) metadatosDocumento.push(`${meta[1].trim()}: ${meta[2].trim()}`);
      continue;
    }

    if (puntoActual && linea.trim() !== '' && !/^#/.test(linea)) {
      puntoActual.partes.push(linea.trim());
    } else if (!puntoActual && linea.trim() !== '' && !/^#/.test(linea)) {
      textoSuelto.push(linea.trim());
    }
  }
  cerrarPunto();
  cerrarSuelto();

  return fragmentos.map((f, i) => ({
    ...f,
    orden: i + 1,
    por_validar: RE_POR_VALIDAR.test(f.contenido),
  }));
}
