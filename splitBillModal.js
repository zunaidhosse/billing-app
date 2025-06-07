// splitBillModal.js
import { DOMElements, render, formatCurrency } from './ui.js';
import { state, getTable, getMenuItem, CURRENCY, TAX_RATE } from './state.js';
import { saveTable } from './db.js';
import { openModal, closeModal } from './modal-utils.js';
import { openReceiptModal } from './receipt.js';
import { openPaymentModal } from './paymentModal.js';

function renderSplitBillItems() {
    const { splitBillModal } = DOMElements;
    const table = getTable(state.currentTableId);
    splitBillModal.itemsContainer.innerHTML = '';

    table.order.forEach(orderItem => {
        const item = getMenuItem(orderItem.id);
        for (let i = 0; i < orderItem.quantity; i++) {
            const uniqueId = `${orderItem.id}_${i}`;
            const el = document.createElement('div');
            el.className = 'order-item';
            el.dataset.uniqueId = uniqueId;
            el.innerHTML = `
                <span class="order-item-name">${item.name}</span>
                <span class="order-item-price">${formatCurrency(item.price)}</span>
            `;
            el.addEventListener('click', () => toggleSplitItem(uniqueId, item.id, item.price));
            splitBillModal.itemsContainer.appendChild(el);
        }
    });
}

function toggleSplitItem(uniqueId, itemId, price) {
    const { splitBillModal } = DOMElements;
    const el = splitBillModal.itemsContainer.querySelector(`[data-unique-id="${uniqueId}"]`);
    const idx = state.splitBill.selectedItems.findIndex(i => i.uniqueId === uniqueId);

    if (idx > -1) {
        state.splitBill.selectedItems.splice(idx, 1);
        el.classList.remove('selected');
    } else {
        state.splitBill.selectedItems.push({ uniqueId, itemId, price });
        el.classList.add('selected');
    }
    
    updateSplitBillSummary();
}

function updateSplitBillSummary() {
    const { splitBillModal } = DOMElements;
    const subtotal = state.splitBill.selectedItems.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    splitBillModal.total.textContent = formatCurrency(total);
    splitBillModal.payBtn.disabled = total <= 0;
}

function handlePaySplit() {
    const totalDue = parseFloat(DOMElements.splitBillModal.total.textContent.replace(CURRENCY, ''));
    if (totalDue <= 0) return;

    openPaymentModal(totalDue, async (amountPaid) => {
        closeModal(DOMElements.paymentModal.modal);
        
        const paidItemsOrder = state.splitBill.selectedItems.reduce((acc, item) => {
            const existing = acc.find(i => i.id === item.itemId);
            if (existing) existing.quantity++;
            else acc.push({ id: item.itemId, quantity: 1 });
            return acc;
        }, []);

        const tempTableForReceipt = {
            name: `${getTable(state.currentTableId).name} (Split Payment)`,
            order: paidItemsOrder,
            paidAmount: 0 
        };
        openReceiptModal(tempTableForReceipt);

        const table = getTable(state.currentTableId);
        
        state.splitBill.selectedItems.forEach(splitItem => {
            const orderItem = table.order.find(oi => oi.id === splitItem.itemId);
            if (orderItem) orderItem.quantity--;
        });
        table.order = table.order.filter(oi => oi.quantity > 0);
        
        if (table.order.length === 0) {
            table.state = 'idle';
            table.paidAmount = 0; 
        } else {
            table.state = 'active';
        }
        
        closeModal(DOMElements.splitBillModal.modal);
        await saveTable(table);
        render();
    });
}

export function openSplitBillModal() {
    const { splitBillModal } = DOMElements;
    state.splitBill = { active: true, selectedItems: [] };
    
    renderSplitBillItems();
    updateSplitBillSummary();
    openModal(splitBillModal.modal);
}

export function initSplitBillModalListeners() {
    DOMElements.splitBillModal.payBtn.addEventListener('click', handlePaySplit);
}