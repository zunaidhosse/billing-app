// db.js

const DB_NAME = 'pos-db';
const DB_VERSION = 2; // Incremented version for schema change
const STORES = {
    tables: 'tables',
    menu: 'menu',
    settings: 'settings',
    history: 'history',
};

let db;

export function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve();
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORES.tables)) {
                dbInstance.createObjectStore(STORES.tables, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(STORES.menu)) {
                dbInstance.createObjectStore(STORES.menu, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(STORES.settings)) {
                dbInstance.createObjectStore(STORES.settings, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(STORES.history)) {
                dbInstance.createObjectStore(STORES.history, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve();
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
    });
}

function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error('Request Error:', request.error);
            reject(request.error);
        };
    });
}

function transactionToPromise(tx) {
     return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (event) => {
            console.error('Transaction Error:', event.target.error);
            reject(event.target.error);
        };
        tx.onabort = (event) => {
            console.error('Transaction Aborted:', event.target.error);
            reject(event.target.error);
        };
    });
}

// --- Tables ---
export function getTables() {
    const tx = db.transaction(STORES.tables, 'readonly');
    const store = tx.objectStore(STORES.tables);
    return requestToPromise(store.getAll());
}

export function saveTable(table) {
    const tx = db.transaction(STORES.tables, 'readwrite');
    const store = tx.objectStore(STORES.tables);
    store.put(table);
    return transactionToPromise(tx);
}

export function deleteTable(tableId) {
    const tx = db.transaction(STORES.tables, 'readwrite');
    const store = tx.objectStore(STORES.tables);
    store.delete(tableId);
    return transactionToPromise(tx);
}

export function saveAllTables(tablesArray) {
    const tx = db.transaction(STORES.tables, 'readwrite');
    const store = tx.objectStore(STORES.tables);
    store.clear();
    tablesArray.forEach(table => {
        store.put(table);
    });
    return transactionToPromise(tx);
}

// --- Menu ---
export function getMenu() {
    const tx = db.transaction(STORES.menu, 'readonly');
    const store = tx.objectStore(STORES.menu);
    return requestToPromise(store.getAll());
}

export function saveMenuItem(item) {
    const tx = db.transaction(STORES.menu, 'readwrite');
    const store = tx.objectStore(STORES.menu);
    store.put(item);
    return transactionToPromise(tx);
}

export function deleteMenuItem(itemId) {
    const tx = db.transaction(STORES.menu, 'readwrite');
    const store = tx.objectStore(STORES.menu);
    store.delete(itemId);
    return transactionToPromise(tx);
}

// --- History ---
export function getHistory() {
    const tx = db.transaction(STORES.history, 'readonly');
    const store = tx.objectStore(STORES.history);
    return requestToPromise(store.getAll());
}

export function saveHistory(entry) {
    const tx = db.transaction(STORES.history, 'readwrite');
    const store = tx.objectStore(STORES.history);
    store.put(entry);
    return transactionToPromise(tx);
}

// --- Settings ---
const SETTINGS_KEY = 'main';

export async function getSettings() {
    const tx = db.transaction(STORES.settings, 'readonly');
    const store = tx.objectStore(STORES.settings);
    const settings = await requestToPromise(store.get(SETTINGS_KEY));
    if (settings) {
        delete settings.id;
    }
    return settings;
}

export function saveSettings(settings) {
    const tx = db.transaction(STORES.settings, 'readwrite');
    const store = tx.objectStore(STORES.settings);
    const settingsToStore = { ...settings, id: SETTINGS_KEY };
    store.put(settingsToStore);
    return transactionToPromise(tx);
}