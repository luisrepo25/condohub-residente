import type { CambiosOperacion, ColaOperaciones, Operacion } from './operacion';

const ALMACEN = 'operaciones';

function abrir(nombre: string): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(nombre, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(ALMACEN, { keyPath: 'clave' });
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error ?? new Error('No se pudo abrir la cola local'));
  });
}

function pedir<R>(db: IDBDatabase, modo: IDBTransactionMode, usar: (almacen: IDBObjectStore) => IDBRequest<R>): Promise<R> {
  return new Promise((resolver, rechazar) => {
    const peticion = usar(db.transaction(ALMACEN, modo).objectStore(ALMACEN));
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error ?? new Error('Falló la cola local'));
  });
}

/** Cola de operaciones en IndexedDB (O2). La clave de idempotencia es la llave primaria: no puede haber dos iguales. */
export function crearColaIndexedDb<T>(nombreBd: string): ColaOperaciones<T> {
  const base = abrir(nombreBd);
  return {
    async agregar(operacion: Operacion<T>): Promise<void> {
      await pedir(await base, 'readwrite', (a) => a.add(operacion));
    },
    async listar(): Promise<Operacion<T>[]> {
      const todas = await pedir(await base, 'readonly', (a) => a.getAll() as IDBRequest<Operacion<T>[]>);
      return todas.sort((x, y) => x.horaDispositivo.localeCompare(y.horaDispositivo));
    },
    async actualizar(clave: string, cambios: CambiosOperacion): Promise<void> {
      const db = await base;
      const actual = await pedir(db, 'readonly', (a) => a.get(clave) as IDBRequest<Operacion<T> | undefined>);
      if (actual) await pedir(db, 'readwrite', (a) => a.put({ ...actual, ...cambios }));
    },
  };
}
