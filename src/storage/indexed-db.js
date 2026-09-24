import { createInitialState } from '../domain/model.js';

const DATABASE = 'corridas-faculdade-db';
const VERSION = 1;
const STORE = 'app';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = event => {
      const db = request.result;
      if (event.oldVersion < 1) db.createObjectStore(STORE);
      // Future schema migrations are added here using event.oldVersion.
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function request(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const action = operation(transaction.objectStore(STORE));
    action.onsuccess = () => resolve(action.result);
    action.onerror = () => reject(action.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export class IndexedDbRepository {
  async load() {
    const stored = await request('readonly', store => store.get('state'));
    if (stored) return stored;
    const state = createInitialState();
    await this.save(state);
    return state;
  }

  save(state) {
    return request('readwrite', store => store.put(state, 'state'));
  }
}
