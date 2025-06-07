// receipt.js
import { default as html2canvas } from 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js';
import { DOMElements } from './ui.js';
import { getMenuItem, calculateBill, CURRENCY, TAX_RATE } from './state.js';
import { openModal } from './modal-utils.js';

function formatReceiptCurrency(amount) {
    return amount.toFixed(2);
}

function generateReceiptHTML(table) {
    const { subtotal, tax, total } = calculateBill(table);
    const now = new Date();

    let itemsHTML = '';
    table.order.forEach((orderItem, index) => {
        const item = getMenuItem(orderItem.id);
        itemsHTML += `
            <tr>
                <td>${index + 1}.</td>
                <td>${item.name}</td>
                <td class="col-qty">${orderItem.quantity}</td>
                <td class="col-rate">${formatReceiptCurrency(item.price)}</td>
                <td class="col-amount">${formatReceiptCurrency(item.price * orderItem.quantity)}</td>
            </tr>
        `;
    });

    return `
        <div class="receipt-header">
            <h3>ZUNAID'S DINE</h3>
            <p>Bhola Barisal Bangladesh</p>
            <p>Contact: +9660581991368</p>
            <p>Email: contact@zunaidsdine.com</p>
            <p>GSTIN: 06ADV..........</p>
            <p>FSSAI Lic. No: 10811234.....</p>
            <h4>INVOICE</h4>
        </div>
        <div class="receipt-details">
            <table>
                <tbody>
                    <tr>
                        <td>Invoice No:</td>
                        <td>IN${String(now.getTime()).slice(-8)}</td>
                        <td>Date:</td>
                        <td>${now.toLocaleDateString('en-GB')}</td>
                    </tr>
                    <tr>
                        <td>Table No:</td>
                        <td>${table.name}</td>
                        <td>Time:</td>
                        <td>${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <table class="items-table">
            <thead>
                <tr>
                    <th class="col-sno">S.NO</th>
                    <th class="col-item">ITEM</th>
                    <th class="col-qty">QTY</th>
                    <th class="col-rate">RATE</th>
                    <th class="col-amount">AMOUNT</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>
        <div class="receipt-summary">
            <div class="summary-row">
                <span>Sub-Total</span>
                <span>${formatReceiptCurrency(subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (${Number((TAX_RATE * 100).toPrecision(15))}%)</span>
                <span>${formatReceiptCurrency(tax)}</span>
            </div>
            <div class="summary-row total">
                <span>GRAND TOTAL</span>
                <span>${CURRENCY} ${formatReceiptCurrency(total)}</span>
            </div>
        </div>
        <div class="receipt-footer">
            <p>*** Thank You, Visit Again! ***</p>
            <p>This is a computer generated receipt.</p>
        </div>
    `;
}

export function openReceiptModal(table) {
    const { receiptModal } = DOMElements;
    receiptModal.paper.innerHTML = generateReceiptHTML(table);
    openModal(receiptModal.modal);
}

export function handleDownloadReceipt() {
    const { receiptModal } = DOMElements;
    const receiptElement = receiptModal.paper;
    const downloadBtn = receiptModal.downloadBtn;

    const originalText = downloadBtn.textContent;
    downloadBtn.textContent = 'Downloading...';
    downloadBtn.disabled = true;

    html2canvas(receiptElement, {
        scale: 2, // Higher resolution
        backgroundColor: '#ffffff',
        useCORS: true, 
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `receipt-${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }).catch(err => {
        console.error("Oops, something went wrong!", err);
        alert("Could not download receipt.");
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    });
}