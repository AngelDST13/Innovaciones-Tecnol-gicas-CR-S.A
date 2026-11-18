/**
 * Simulador en memoria de la API de supabase-js (solo lo que usa el backend).
 * Soporta: select (con columnas, head/count), eq/neq/gt/gte/lt/lte/in/ilike, order, limit,
 * maybeSingle/single, insert/upsert/update/delete con select encadenado, y rpc.
 * Registra cada filtro por igualdad para verificar que las consultas filtran por el usuario correcto.
 */

export class FakeSupabase {
  constructor(tablas = {}) {
    this.tablas = structuredClone(tablas);
    this.ids = {};
    this.igualdades = []; // [tabla, columna, valor] de cada eq()
    this.errorSiguiente = null; // se devuelve en la próxima operación
    this.erroresEnCola = []; // cola por operación: null = correcta, objeto = error (se consume en orden)
    this.rpcs = {}; // nombre -> función (args) => filas
  }

  from(tabla) {
    return new Consulta(this, tabla);
  }

  rpc(nombre, args) {
    const fn = this.rpcs[nombre];
    // Sin función registrada, la búsqueda no encuentra fragmentos (comportamiento de una base vacía)
    if (!fn) return Promise.resolve({ data: [], error: null });
    return Promise.resolve({ data: fn(args), error: null });
  }

  siguienteId(tabla) {
    this.ids[tabla] = (this.ids[tabla] ?? 0) + 1;
    return this.ids[tabla];
  }

  reiniciar(tablas) {
    this.tablas = structuredClone(tablas);
    this.igualdades = [];
    this.errorSiguiente = null;
  }
}

function proyectar(fila, columnas) {
  if (!columnas || columnas.trim() === '*') return { ...fila };
  const campos = columnas.split(',').map((c) => c.trim());
  return Object.fromEntries(campos.map((c) => [c, fila[c] ?? null]));
}

function comparar(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  return a < b ? -1 : 1;
}

class Consulta {
  constructor(db, tabla) {
    this.db = db;
    this.tabla = tabla;
    this.filtros = [];
    this.orden = [];
    this.limite = null;
    this.operacion = 'select';
    this.carga = null;
    this.columnas = null;
    this.opciones = {};
    this.unico = null; // 'maybe' | 'single'
  }

  select(columnas = '*', opciones = {}) {
    this.columnas = columnas;
    this.opciones = { ...this.opciones, ...opciones };
    return this;
  }

  insert(filas) {
    this.operacion = 'insert';
    this.carga = Array.isArray(filas) ? filas : [filas];
    return this;
  }

  upsert(filas, opciones = {}) {
    this.operacion = 'upsert';
    this.carga = Array.isArray(filas) ? filas : [filas];
    this.opciones = { ...this.opciones, ...opciones };
    return this;
  }

  update(valores) {
    this.operacion = 'update';
    this.carga = valores;
    return this;
  }

  delete() {
    this.operacion = 'delete';
    return this;
  }

  eq(col, valor) {
    this.db.igualdades.push([this.tabla, col, valor]);
    this.filtros.push((r) => r[col] === valor);
    return this;
  }

  neq(col, valor) {
    this.filtros.push((r) => r[col] !== valor);
    return this;
  }

  gt(col, valor) {
    this.filtros.push((r) => comparar(r[col], valor) > 0);
    return this;
  }

  gte(col, valor) {
    this.filtros.push((r) => comparar(r[col], valor) >= 0);
    return this;
  }

  lt(col, valor) {
    this.filtros.push((r) => comparar(r[col], valor) < 0);
    return this;
  }

  lte(col, valor) {
    this.filtros.push((r) => comparar(r[col], valor) <= 0);
    return this;
  }

  in(col, valores) {
    this.filtros.push((r) => valores.includes(r[col]));
    return this;
  }

  ilike(col, patron) {
    const literal = patron.replace(/\\(.)/g, '$1').toLowerCase();
    this.filtros.push((r) => String(r[col] ?? '').toLowerCase() === literal);
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orden.push([col, ascending]);
    return this;
  }

  limit(n) {
    this.limite = n;
    return this;
  }

  maybeSingle() {
    this.unico = 'maybe';
    return this;
  }

  single() {
    this.unico = 'single';
    return this;
  }

  filas() {
    return this.db.tablas[this.tabla] ?? (this.db.tablas[this.tabla] = []);
  }

  seleccionar() {
    let filas = this.filas().filter((r) => this.filtros.every((f) => f(r)));
    for (const [col, asc] of [...this.orden].reverse()) {
      filas = [...filas].sort((a, b) => (asc ? comparar(a[col], b[col]) : comparar(b[col], a[col])));
    }
    if (this.limite !== null) filas = filas.slice(0, this.limite);
    return filas;
  }

  async ejecutar() {
    if (this.db.erroresEnCola.length > 0) {
      const siguiente = this.db.erroresEnCola.shift();
      if (siguiente) return { data: null, error: siguiente };
    }
    if (this.db.errorSiguiente) {
      const error = this.db.errorSiguiente;
      this.db.errorSiguiente = null;
      return { data: null, error };
    }

    if (this.operacion === 'select') {
      const filas = this.seleccionar();
      if (this.opciones.head) return { data: null, count: filas.length, error: null };
      return this.resultado(filas.map((r) => proyectar(r, this.columnas)));
    }

    if (this.operacion === 'insert') {
      const nuevas = this.carga.map((f) => ({
        id: this.db.siguienteId(this.tabla),
        fecha: new Date().toISOString(),
        ...f,
      }));
      this.filas().push(...nuevas);
      return this.resultado(nuevas.map((r) => proyectar(r, this.columnas)));
    }

    if (this.operacion === 'upsert') {
      const clave = this.opciones.onConflict;
      const resultados = this.carga.map((f) => {
        const existente = clave ? this.filas().find((r) => r[clave] === f[clave]) : null;
        if (existente) {
          Object.assign(existente, f);
          return existente;
        }
        const nueva = { id: this.db.siguienteId(this.tabla), ...f };
        this.filas().push(nueva);
        return nueva;
      });
      return this.resultado(resultados.map((r) => proyectar(r, this.columnas)));
    }

    if (this.operacion === 'update') {
      const afectadas = this.seleccionar();
      for (const fila of afectadas) Object.assign(fila, this.carga);
      return { data: null, error: null };
    }

    if (this.operacion === 'delete') {
      const aEliminar = new Set(this.seleccionar());
      this.db.tablas[this.tabla] = this.filas().filter((r) => !aEliminar.has(r));
      return { data: null, error: null };
    }
    throw new Error(`operación no soportada: ${this.operacion}`);
  }

  resultado(filas) {
    if (this.unico === 'maybe') return { data: filas[0] ?? null, error: null };
    if (this.unico === 'single') {
      return filas.length === 1 ? { data: filas[0], error: null } : { data: null, error: { message: 'no es una fila única' } };
    }
    return { data: filas, error: null };
  }

  then(resolver, rechazar) {
    return this.ejecutar().then(resolver, rechazar);
  }
}
