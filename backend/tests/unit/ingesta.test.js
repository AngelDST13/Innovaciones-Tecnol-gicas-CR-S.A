import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { db, resetearMocks } from '../helpers/mocks.js';

const { sincronizarPoliticas } = await import('../../src/rag/ingesta.js');

/** Drive simulado: solo changes.* (no se escribe nada en Drive). */
function driveConCambios(respuestaCambios) {
  return {
    changes: {
      getStartPageToken: jest.fn(async () => ({ data: { startPageToken: 'tok-nuevo-inicial' } })),
      list: jest.fn(async () => ({ data: respuestaCambios })),
    },
  };
}

const registrar = { info: () => {}, warn: () => {}, error: () => {} };

describe('ingesta por cambios de Drive (changes.list)', () => {
  beforeEach(() => resetearMocks());

  it('un archivo borrado en Drive se marca eliminado, pierde sus fragmentos y se guarda el token nuevo', async () => {
    const drive = driveConCambios({ changes: [{ fileId: 'doc-1', removed: true }], newStartPageToken: 'tok-2' });

    const resumen = await sincronizarPoliticas({ registrar, drive });

    expect(resumen).toMatchObject({ modo: 'cambios', eliminados: 1, nuevos: 0 });
    expect(db.tablas.documentos_politica.find((d) => d.id === 11).eliminado).toBe(true);
    expect(db.tablas.fragmentos_politica.some((f) => f.documento_id === 11)).toBe(false);
    expect(db.tablas.sync_drive_estado[0].page_token).toBe('tok-2');
  });

  it('un archivo movido fuera de la carpeta cuenta como eliminado', async () => {
    const drive = driveConCambios({
      changes: [{ fileId: 'doc-1', removed: false, file: { id: 'doc-1', name: 'POL-01 Vacaciones v2.1.pdf', trashed: false, parents: ['otra-carpeta'], modifiedTime: '2026-11-01T00:00:00Z' } }],
      newStartPageToken: 'tok-3',
    });

    const resumen = await sincronizarPoliticas({ registrar, drive });

    expect(resumen.eliminados).toBe(1);
    expect(db.tablas.documentos_politica.find((d) => d.id === 11).eliminado).toBe(true);
  });

  it('sin cambios no toca la base y solo avanza el token', async () => {
    const drive = driveConCambios({ changes: [], newStartPageToken: 'tok-4' });

    const resumen = await sincronizarPoliticas({ registrar, drive });

    expect(resumen).toMatchObject({ modo: 'cambios', eliminados: 0, nuevos: 0, actualizados: 0 });
    expect(db.tablas.documentos_politica.every((d) => d.eliminado === false)).toBe(true);
    expect(db.tablas.sync_drive_estado[0].page_token).toBe('tok-4');
  });

  it('pagina changes.list hasta el último token', async () => {
    const drive = {
      changes: {
        getStartPageToken: jest.fn(),
        list: jest.fn()
          .mockResolvedValueOnce({ data: { changes: [], nextPageToken: 'pagina-2' } })
          .mockResolvedValueOnce({ data: { changes: [], newStartPageToken: 'tok-final' } }),
      },
    };

    await sincronizarPoliticas({ registrar, drive });

    expect(drive.changes.list).toHaveBeenCalledTimes(2);
    expect(drive.changes.list.mock.calls[1][0].pageToken).toBe('pagina-2');
    expect(db.tablas.sync_drive_estado[0].page_token).toBe('tok-final');
  });
});
