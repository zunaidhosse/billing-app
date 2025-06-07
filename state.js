// state.js
import { getTables, saveAllTables, getMenu, saveMenuItem, getSettings, saveSettings, getHistory } from './db.js';

export const CURRENCY = '$';
export const TAX_RATE = 0.02; // 2%

export let state = {
    currentView: 'tables', // 'tables' or 'order'
    currentTableId: null,
    activeMenuCategory: 'All',
    tables: [],
    menu: [],
    history: [],
    settings: {
        tableCount: 20,
    },
    splitBill: {
        active: false,
        selectedItems: []
    }
};

export function saveData() {
    console.warn("saveData is deprecated. Use DB functions instead.");
}

export async function loadData() {
    const settingsFromDB = await getSettings();
    if (settingsFromDB) {
        state.settings = settingsFromDB;
    } else {
        // First run, save default settings
        await saveSettings(state.settings);
    }

    const menuFromDB = await getMenu();
    if (menuFromDB && menuFromDB.length > 0) {
        state.menu = menuFromDB;
    } else {
        // Default menu
        state.menu = [
            { id: 1, name: 'Cheeseburger', category: 'Mains', price: 9.99 },
            { id: 2, name: 'Fries', category: 'Sides', price: 3.50 },
            { id: 3, name: 'Salad', category: 'Sides', price: 4.25 },
            { id: 4, name: 'Steak', category: 'Mains', price: 18.00 },
            { id: 5, name: 'Ice Cream', category: 'Desserts', price: 4.00 },
            { id: 6, name: 'Soda', category: 'Drinks', price: 2.00 },
            { id: 7, name: 'Water', category: 'Drinks', price: 1.00 },
        ];
        // Save to DB
        await Promise.all(state.menu.map(item => saveMenuItem(item)));
    }

    const tablesFromDB = await getTables();
    // Only reset tables if the count is different. This preserves tables if app is just reloaded.
    if (tablesFromDB && tablesFromDB.length > 0 && tablesFromDB.length === state.settings.tableCount) {
        state.tables = tablesFromDB;
    } else if (tablesFromDB && tablesFromDB.length > 0 && state.settings.tableCount !== tablesFromDB.length) {
        // If count has been changed in settings but tables are not yet reset, load existing tables.
        // The add/delete/reset logic will handle syncing.
        state.tables = tablesFromDB;
    }
    else {
        await initializeTables();
    }
    
    // Load history
    state.history = await getHistory() || [];
}

export async function initializeTables() {
    state.tables = [];
    for (let i = 1; i <= state.settings.tableCount; i++) {
        state.tables.push({
            id: i,
            name: `Table ${i}`,
            state: 'idle', // idle, active, billed
            order: [],
            paidAmount: 0,
        });
    }
    await saveAllTables(state.tables);
}

export function getTable(id) {
    return state.tables.find(t => t.id == id);
}

export function getMenuItem(id) {
    return state.menu.find(m => m.id == id);
}

export function calculateBill(tableOrOrder) {
    let order;
    if (Array.isArray(tableOrOrder.order)) { // It's a table object
        order = tableOrOrder.order;
    } else { // It's an order array
        order = tableOrOrder;
    }

    const subtotal = order.reduce((sum, orderItem) => {
        const item = getMenuItem(orderItem.id);
        return sum + (item.price * orderItem.quantity);
    }, 0);

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    const paidAmount = tableOrOrder.paidAmount || 0;
    const balanceDue = total - paidAmount;

    return { subtotal, tax, total, paidAmount, balanceDue };
}