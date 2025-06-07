// historyModal.js
import { DOMElements, formatCurrency } from './ui.js';
import { state } from './state.js';
import { openModal } from './modal-utils.js';
import { openReceiptModal } from './receipt.js';

function renderHistoryList() {
    const { historyModal } = DOMElements;
    historyModal.list.innerHTML = '';

    if (state.history.length === 0) {
        historyModal.list.innerHTML = '<p>No completed orders yet.</p>';
        return;
    }

    // Sort by most recent first
    const sortedHistory = [...state.history].sort((a, b) => b.id - a.id);

    sortedHistory.forEach(entry => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.dataset.historyId = entry.id;

        const date = new Date(entry.date);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

        el.innerHTML = `
            <div class="history-item-header">
                <span>${entry.tableName}</span>
                <span>${formatCurrency(entry.bill.total)}</span>
            </div>
            <div class="history-item-body">
                <span>Order #${entry.id} - ${formattedDate}</span>
            </div>
        `;

        el.addEventListener('click', () => {
             // Create a table-like object for the receipt generator
            const tableForReceipt = {
                name: entry.tableName,
                order: entry.order,
                paidAmount: 0 // Not relevant for historical receipt
            };
            openReceiptModal(tableForReceipt);
        });
        historyModal.list.appendChild(el);
    });
}

export function openHistoryModal() {
    renderHistoryList();
    openModal(DOMElements.historyModal.modal);
}