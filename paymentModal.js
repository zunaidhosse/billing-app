// paymentModal.js
import { DOMElements, render, formatCurrency } from './ui.js';
import { state, getTable, calculateBill } from './state.js';
import { backToTables } from './handlers.js';
import { saveTable, saveHistory as dbSaveHistory } from './db.js';
import { openModal, closeModal } from './modal-utils.js';
import { openReceiptModal } from './receipt.js';

/**
 * Opens a modal for processing a payment.
 * @param {number} totalDue - The total amount due.
 * @param {function} onPayment - A callback function to execute when payment is processed.
 */
export function openPaymentModal(totalDue, onPayment) {
    const { paymentModal } = DOMElements;
    paymentModal.total.textContent = formatCurrency(totalDue);
    paymentModal.amount.value = '';
    paymentModal.changeDue.textContent = formatCurrency(0);
    paymentModal.processBtn.disabled = true;
    
    paymentModal.quickCashBtns.innerHTML = '';
    const exactBtn = document.createElement('button');
    exactBtn.className = 'quick-cash-btn';
    exactBtn.textContent = 'Exact';
    exactBtn.onclick = () => {
        paymentModal.amount.value = totalDue.toFixed(2);
        paymentModal.amount.dispatchEvent(new Event('input'));
    };
    paymentModal.quickCashBtns.appendChild(exactBtn);
    
    const nextBills = [5, 10, 20, 50, 100].filter(val => val > totalDue);
    let count = 0;
    for(const val of nextBills) {
        if(count++ >= 2) break;
        const btn = document.createElement('button');
        btn.className = 'quick-cash-btn';
        btn.textContent = formatCurrency(val);
        btn.onclick = () => {
            paymentModal.amount.value = val;
            paymentModal.amount.dispatchEvent(new Event('input'));
        };
        paymentModal.quickCashBtns.appendChild(btn);
    }

    const amountInputHandler = () => {
        const amountTendered = parseFloat(paymentModal.amount.value) || 0;
        const change = amountTendered - totalDue;
        paymentModal.changeDue.textContent = formatCurrency(Math.max(0, change));
        paymentModal.processBtn.disabled = amountTendered < totalDue;
    };

    const processHandler = async () => {
        const amountTendered = parseFloat(paymentModal.amount.value);
        await onPayment(amountTendered);
        paymentModal.amount.removeEventListener('input', amountInputHandler);
        paymentModal.processBtn.onclick = null;
    };

    paymentModal.amount.addEventListener('input', amountInputHandler);
    paymentModal.processBtn.onclick = processHandler;

    openModal(paymentModal.modal);
    paymentModal.amount.focus();
}

/**
 * Initiates the payment process for the current table.
 */
export function handlePay() {
    const table = getTable(state.currentTableId);
    const { balanceDue } = calculateBill(table);

    openPaymentModal(balanceDue, async (amountPaid) => {
        const paymentAmount = Math.min(balanceDue, amountPaid);
        table.paidAmount += paymentAmount;

        const stillDue = calculateBill(table).balanceDue;

        openReceiptModal(table);

        if (stillDue <= 0.005) { // Paid in full
            alert(`Payment complete. Change: ${formatCurrency(amountPaid - paymentAmount)}`);
            
            const historyEntry = {
                id: Date.now(),
                tableName: table.name,
                order: JSON.parse(JSON.stringify(table.order)),
                bill: calculateBill(table),
                date: new Date().toISOString()
            };
            state.history.push(historyEntry);
            await dbSaveHistory(historyEntry);

            table.order = [];
            table.paidAmount = 0;
            table.state = 'idle';
        } else { // Partial payment
            alert(`Partial payment of ${formatCurrency(paymentAmount)} received.`);
        }
        
        closeModal(DOMElements.paymentModal.modal);
        await saveTable(table);
        
        if (stillDue <= 0.005) {
            backToTables();
        } else {
            render();
        }
    });
}