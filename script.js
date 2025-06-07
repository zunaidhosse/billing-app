import { DOMElements, render } from './ui.js';
import { loadData } from './state.js';
import { backToTables, printBill } from './handlers.js';
import { 
    closeParentModal,
    closeAllModals
} from './modal-utils.js';
import { openAdminModal, initAdminModalListeners } from './adminModal.js';
import { openCatalogModal, initCatalogModalListeners } from './catalogModal.js';
import { handlePay } from './paymentModal.js';
import { openSplitBillModal, initSplitBillModalListeners } from './splitBillModal.js';
import { openHistoryModal } from './historyModal.js';
import { initDB } from './db.js';
import { handleDownloadReceipt } from './receipt.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- TOMBSTONES for refactored code ---
    // The following constants, objects, and functions were moved to separate modules
    // to improve code organization and maintainability.

    // removed: const CURRENCY = '$';
    // removed: const TAX_RATE = 0.10;
    // --- moved to state.js ---

    // removed: const DOMElements = { ... };
    // --- moved to ui.js ---

    // removed: let state = { ... };
    // --- moved to state.js ---

    // removed: const CategoryColors = {};
    // removed: const assignCategoryColor = (category) => { ... };
    // --- moved to ui.js ---

    // removed: function saveData() { ... }
    // removed: function loadData() { ... }
    // removed: function initializeTables() { ... }
    // --- moved to state.js ---

    // removed: function render() { ... }
    // removed: function renderTablesGrid() { ... }
    // removed: function renderOrderScreen() { ... }
    // removed: function renderMenuCategories() { ... }
    // removed: function renderMenuItems() { ... }
    // removed: function renderBill() { ... }
    // removed: function updateBillActionButtons() { ... }
    // --- moved to ui.js ---

    // removed: function selectTable(tableId) { ... }
    // removed: function backToTables() { ... }
    // removed: function addItemToOrder(itemId) { ... }
    // removed: function updateItemQuantity(itemId, change) { ... }
    // removed: function printBill() { ... }
    // --- moved to handlers.js ---

    // removed: function calculateBill(tableOrOrder) { ... }
    // --- moved to state.js ---

    // removed: function getTable(id) { ... }
    // removed: function getMenuItem(id) { ... }
    // --- moved to state.js ---

    // removed: function formatCurrency(amount) { ... }
    // --- moved to ui.js ---

    // removed: --- Modals Logic --- and all related functions
    // --- moved from modals.js ---
    // The modals.js file has been refactored and split into multiple files for better organization:
    // - modal-utils.js: For generic modal open/close functions.
    // - menu-management.js: For shared logic between admin and catalog menu editors.
    // - adminModal.js: For the admin settings modal.
    // - catalogModal.js: For the catalog & items modal.
    // - paymentModal.js: For handling payments.
    // - splitBillModal.js: For splitting bills.
    // - historyModal.js: For viewing order history.


    // --- Event Listeners ---
    function setupEventListeners() {
        DOMElements.backToTablesBtn.addEventListener('click', backToTables);
        DOMElements.printBillBtn.addEventListener('click', printBill);
        DOMElements.payBtn.addEventListener('click', handlePay);
        DOMElements.splitBillBtn.addEventListener('click', openSplitBillModal);
        DOMElements.adminBtn.addEventListener('click', openAdminModal);
        DOMElements.historyBtn.addEventListener('click', openHistoryModal);
        DOMElements.catalogBtn.addEventListener('click', openCatalogModal);

        // Modals
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', closeParentModal);
        });
        DOMElements.modalBackdrop.addEventListener('click', closeAllModals);
        
        // Initialize listeners within each modal's component
        initAdminModalListeners();
        initCatalogModalListeners();
        initSplitBillModalListeners();
        
        // Receipt Modal listener
        DOMElements.receiptModal.downloadBtn.addEventListener('click', handleDownloadReceipt);
    }
    
    // --- Initialization ---
    async function init() {
        await initDB();
        await loadData();
        setupEventListeners();
        render();
    }

    init();
});