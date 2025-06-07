// ui.js
import { state, getTable, getMenuItem, calculateBill, CURRENCY } from './state.js';
import { selectTable, addItemToOrder, updateItemQuantity } from './handlers.js';

export const DOMElements = {
    headerTitle: document.getElementById('header-title'),
    tablesView: document.getElementById('tables-view'),
    orderView: document.getElementById('order-view'),
    tablesGrid: document.getElementById('tables-grid'),
    backToTablesBtn: document.getElementById('back-to-tables-btn'),
    billTableTitle: document.getElementById('bill-table-title'),
    billTableStatus: document.getElementById('bill-table-status'),
    menuCategories: document.getElementById('menu-categories'),
    menuItems: document.getElementById('menu-items'),
    orderList: document.getElementById('order-list'),
    subtotal: document.getElementById('subtotal'),
    tax: document.getElementById('tax'),
    total: document.getElementById('total'),
    amountPaidContainer: document.getElementById('amount-paid-container'),
    amountPaid: document.getElementById('amount-paid'),
    balanceDueContainer: document.getElementById('balance-due-container'),
    balanceDue: document.getElementById('balance-due'),
    payBtn: document.getElementById('pay-btn'),
    printBillBtn: document.getElementById('print-bill-btn'),
    splitBillBtn: document.getElementById('split-bill-btn'),
    adminBtn: document.getElementById('admin-btn'),
    historyBtn: document.getElementById('history-btn'),
    catalogBtn: document.getElementById('catalog-btn'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    // Admin Modal
    adminModal: {
        modal: document.getElementById('admin-modal'),
        tableList: document.getElementById('table-list'),
        tableNameInput: document.getElementById('table-name'),
        addTableBtn: document.getElementById('add-table-btn'),
        tableCountInput: document.getElementById('table-count'),
        menuItemList: document.getElementById('menu-item-list'),
        menuItemId: document.getElementById('menu-item-id'),
        menuItemName: document.getElementById('menu-item-name'),
        menuItemCategory: document.getElementById('menu-item-category'),
        menuItemPrice: document.getElementById('menu-item-price'),
        saveMenuItemBtn: document.getElementById('save-menu-item-btn'),
        clearMenuFormBtn: document.getElementById('clear-menu-form-btn'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
    },
    // Payment Modal
    paymentModal: {
        modal: document.getElementById('payment-modal'),
        total: document.getElementById('payment-total'),
        amount: document.getElementById('payment-amount'),
        changeDue: document.getElementById('change-due'),
        processBtn: document.getElementById('process-payment-btn'),
        quickCashBtns: document.querySelector('.quick-cash-buttons'),
    },
    // Split Bill Modal
    splitBillModal: {
        modal: document.getElementById('split-bill-modal'),
        itemsContainer: document.getElementById('split-bill-items'),
        total: document.getElementById('split-total'),
        payBtn: document.getElementById('pay-split-bill-btn'),
    },
    // Receipt Modal
    receiptModal: {
        modal: document.getElementById('receipt-modal'),
        paper: document.getElementById('receipt-paper'),
        downloadBtn: document.getElementById('download-receipt-btn'),
    },
    // History Modal
    historyModal: {
        modal: document.getElementById('history-modal'),
        list: document.getElementById('history-list'),
    },
    // Catalog Modal
    catalogModal: {
        modal: document.getElementById('catalog-modal'),
        itemList: document.getElementById('catalog-item-list'),
        itemId: document.getElementById('catalog-item-id'),
        itemName: document.getElementById('catalog-item-name'),
        itemCategory: document.getElementById('catalog-item-category'),
        itemPrice: document.getElementById('catalog-item-price'),
        saveBtn: document.getElementById('save-catalog-item-btn'),
        clearBtn: document.getElementById('clear-catalog-form-btn'),
    }
};

const CategoryColors = {};
export const assignCategoryColor = (category) => {
    if (!CategoryColors[category]) {
        const hue = Object.keys(CategoryColors).length * 137.508; // Golden angle
        CategoryColors[category] = `hsl(${hue % 360}, 50%, 45%)`;
    }
    return CategoryColors[category];
};

export function formatCurrency(amount) {
    return `${CURRENCY}${amount.toFixed(2)}`;
}

export function render() {
    if (state.currentView === 'tables') {
        DOMElements.tablesView.classList.add('active');
        DOMElements.orderView.classList.remove('active');
        DOMElements.headerTitle.textContent = 'All Tables';
        renderTablesGrid();
    } else {
        DOMElements.tablesView.classList.remove('active');
        DOMElements.orderView.classList.add('active');
        const table = getTable(state.currentTableId);
        DOMElements.headerTitle.textContent = table.name;
        renderOrderScreen();
    }
}

export function renderTablesGrid() {
    DOMElements.tablesGrid.innerHTML = '';
    state.tables.forEach(table => {
        const tableEl = document.createElement('div');
        tableEl.className = `table-button ${table.state}`;
        tableEl.dataset.tableId = table.id;
        tableEl.innerHTML = `
            <span>${table.name}</span>
            <span class="table-status-indicator">${table.state}</span>
        `;
        tableEl.addEventListener('click', () => selectTable(table.id));
        DOMElements.tablesGrid.appendChild(tableEl);
    });
}

export function renderOrderScreen() {
    const table = getTable(state.currentTableId);
    if (!table) return;

    DOMElements.billTableTitle.textContent = table.name;
    DOMElements.billTableStatus.textContent = table.state;
    DOMElements.billTableStatus.className = table.state;
    
    renderMenuCategories();
    renderMenuItems();
    renderBill();
    updateBillActionButtons();
}

function renderMenuCategories() {
    const categories = ['All', ...new Set(state.menu.map(item => item.category))];
    DOMElements.menuCategories.innerHTML = '';
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category;
        btn.style.backgroundColor = category === 'All' ? '#666' : assignCategoryColor(category);
        if (state.activeMenuCategory === category) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            state.activeMenuCategory = category;
            renderMenuItems();
            renderMenuCategories(); // to update active class
        });
        DOMElements.menuCategories.appendChild(btn);
    });
}

function renderMenuItems() {
    DOMElements.menuItems.innerHTML = '';
    const filteredMenu = state.activeMenuCategory === 'All'
        ? state.menu
        : state.menu.filter(item => item.category === state.activeMenuCategory);

    filteredMenu.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'menu-item-btn';
        btn.dataset.itemId = item.id;
        btn.style.borderColor = assignCategoryColor(item.category);
        btn.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-price">${formatCurrency(item.price)}</span>
        `;
        btn.addEventListener('click', () => addItemToOrder(item.id));
        DOMElements.menuItems.appendChild(btn);
    });
}

export function renderBill() {
    const table = getTable(state.currentTableId);
    DOMElements.orderList.innerHTML = '';
    if (!table) return;

    table.order.forEach(orderItem => {
        const item = getMenuItem(orderItem.id);
        const el = document.createElement('div');
        el.className = 'order-item';
        el.innerHTML = `
            <span class="order-item-name">${item.name}</span>
            <div class="order-item-controls">
                <button class="quantity-change" data-item-id="${orderItem.id}" data-change="-1"><img src="minus.png"></button>
                <span>${orderItem.quantity}</span>
                <button class="quantity-change" data-item-id="${orderItem.id}" data-change="1"><img src="plus.png"></button>
            </div>
            <span class="order-item-price">${formatCurrency(item.price * orderItem.quantity)}</span>
        `;
        DOMElements.orderList.appendChild(el);
    });

    // Add event listeners to new buttons
    DOMElements.orderList.querySelectorAll('.quantity-change').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.currentTarget.dataset.itemId;
            const change = parseInt(e.currentTarget.dataset.change, 10);
            updateItemQuantity(itemId, change);
        });
    });

    const { subtotal, tax, total, balanceDue } = calculateBill(table);
    DOMElements.subtotal.textContent = formatCurrency(subtotal);
    DOMElements.tax.textContent = formatCurrency(tax);
    DOMElements.total.textContent = formatCurrency(total);

    if (table.paidAmount > 0) {
        DOMElements.amountPaidContainer.classList.remove('hidden');
        DOMElements.balanceDueContainer.classList.remove('hidden');
        DOMElements.amountPaid.textContent = formatCurrency(table.paidAmount);
        DOMElements.balanceDue.textContent = formatCurrency(balanceDue);
    } else {
        DOMElements.amountPaidContainer.classList.add('hidden');
        DOMElements.balanceDueContainer.classList.add('hidden');
    }
}

export function updateBillActionButtons() {
    const table = getTable(state.currentTableId);
    const hasItems = table && table.order.length > 0;
    
    DOMElements.printBillBtn.disabled = !hasItems || table.state === 'billed';
    DOMElements.splitBillBtn.disabled = !hasItems;
    DOMElements.payBtn.disabled = !hasItems;
}