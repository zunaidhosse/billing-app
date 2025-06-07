// handlers.js
import { state, getTable } from './state.js';
import { render, renderBill, updateBillActionButtons, renderTablesGrid, renderOrderScreen } from './ui.js';
import { saveTable } from './db.js';
import { openReceiptModal } from './receipt.js';

export function selectTable(tableId) {
    state.currentTableId = tableId;
    state.currentView = 'order';
    render();
}

export function backToTables() {
    state.currentTableId = null;
    state.currentView = 'tables';
    render();
}

export async function addItemToOrder(itemId) {
    const table = getTable(state.currentTableId);
    if (table.state === 'billed') {
        alert('Bill has been printed. Cannot add more items until payment is complete.');
        return;
    }

    const existingItem = table.order.find(item => item.id === itemId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        table.order.push({ id: itemId, quantity: 1 });
    }
    
    if (table.state === 'idle') {
        table.state = 'active';
    }
    
    renderBill();
    updateBillActionButtons();
    await saveTable(table);
}

export async function updateItemQuantity(itemId, change) {
    const table = getTable(state.currentTableId);
    if (table.state === 'billed') {
        alert('Bill has been printed. Cannot modify order.');
        return;
    }
    const orderItem = table.order.find(item => item.id == itemId);
    if (orderItem) {
        orderItem.quantity += change;
        if (orderItem.quantity <= 0) {
            table.order = table.order.filter(item => item.id != itemId);
        }
    }
    
    if (table.order.length === 0 && table.paidAmount === 0) {
        table.state = 'idle';
    }
    
    renderBill();
    updateBillActionButtons();
    await saveTable(table);
}

export async function printBill() {
    const table = getTable(state.currentTableId);
    if (table.order.length > 0) {
        table.state = 'billed';
        // Open receipt modal instead of alert
        openReceiptModal(table);
        
        renderOrderScreen();
        renderTablesGrid(); // Update table color on main screen
        await saveTable(table);
    }
}