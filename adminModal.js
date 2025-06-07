// adminModal.js
import { DOMElements, render, renderTablesGrid } from './ui.js';
import { state, initializeTables, getTable } from './state.js';
import { saveTable, saveSettings as dbSaveSettings, deleteTable as dbDeleteTable } from './db.js';
import { openModal, closeModal } from './modal-utils.js';
import { renderMenuEditorUI, selectMenuItemForEdit, clearMenuForm, saveMenuItem, deleteMenuItem } from './menu-management.js';

// --- Helper for Menu Editor ---
function getMenuEditorFormElements() {
    const { adminModal } = DOMElements;
    return {
        idInput: adminModal.menuItemId,
        nameInput: adminModal.menuItemName,
        categoryInput: adminModal.menuItemCategory,
        priceInput: adminModal.menuItemPrice,
        listElement: adminModal.menuItemList
    };
}

// --- Table Management ---
function renderTableEditor() {
    const { tableList } = DOMElements.adminModal;
    tableList.innerHTML = '';
    state.tables.forEach(table => {
        const el = document.createElement('div');
        el.className = 'table-editor-item';
        el.dataset.tableId = table.id;
        el.innerHTML = `
             <div class="table-editor-item-details">
                <span>${table.name}</span>
             </div>
             <div class="menu-editor-item-actions">
                <button class="delete-table-btn"><img src="trash.png" alt="Delete"></button>
            </div>
        `;
        el.querySelector('.delete-table-btn').addEventListener('click', () => handleDeleteTable(table.id));
        tableList.appendChild(el);
    });
}

async function handleAddTable() {
    const { tableNameInput } = DOMElements.adminModal;
    const name = tableNameInput.value.trim();
    if (!name) {
        alert('Please enter a table name.');
        return;
    }

    const newId = state.tables.length > 0 ? Math.max(...state.tables.map(t => t.id)) + 1 : 1;
    const newTable = { id: newId, name, state: 'idle', order: [], paidAmount: 0 };

    state.tables.push(newTable);
    await saveTable(newTable);
    
    tableNameInput.value = '';
    renderTableEditor();
    renderTablesGrid();
}

async function handleDeleteTable(tableId) {
    const table = getTable(tableId);
    if (!table) return;

    if (table.state !== 'idle' || table.order.length > 0) {
        alert(`Cannot delete table "${table.name}" because it has an active or billed order.`);
        return;
    }

    if (confirm(`Are you sure you want to delete table "${table.name}"? This cannot be undone.`)) {
        state.tables = state.tables.filter(t => t.id !== tableId);
        await dbDeleteTable(tableId);
        renderTableEditor();
        renderTablesGrid();
    }
}

// --- Menu Management ---
function renderMenuEditor() {
    renderMenuEditorUI(DOMElements.adminModal.menuItemList, handleSelectMenuItem, handleDeleteMenuItem);
}

function handleSelectMenuItem(itemId) {
    selectMenuItemForEdit(itemId, getMenuEditorFormElements());
}

async function handleSaveMenuItem() {
    const success = await saveMenuItem(getMenuEditorFormElements());
    if (success) {
        renderMenuEditor();
        clearMenuForm(getMenuEditorFormElements());
    }
}

async function handleDeleteMenuItem(itemId) {
    const success = await deleteMenuItem(itemId);
    if (success) {
        renderMenuEditor();
        clearMenuForm(getMenuEditorFormElements());
    }
}

function handleClearMenuForm() {
    clearMenuForm(getMenuEditorFormElements());
}

// --- General Settings ---
async function saveAdminSettings() {
    const newCount = parseInt(DOMElements.adminModal.tableCountInput.value);
    if (newCount !== state.settings.tableCount) {
         if (confirm('Changing table count will reset ALL current tables and orders. This is a destructive action. Are you sure?')) {
            state.settings.tableCount = newCount;
            await initializeTables();
        }
    }
    await dbSaveSettings(state.settings);
    closeModal(DOMElements.adminModal.modal);
    render();
}

// --- Public Functions ---
export function openAdminModal() {
    const { adminModal } = DOMElements;
    adminModal.tableCountInput.value = state.settings.tableCount;
    renderTableEditor();
    renderMenuEditor();
    openModal(adminModal.modal);
}

export function initAdminModalListeners() {
    const { adminModal } = DOMElements;
    adminModal.addTableBtn.addEventListener('click', handleAddTable);
    adminModal.saveMenuItemBtn.addEventListener('click', handleSaveMenuItem);
    adminModal.clearMenuFormBtn.addEventListener('click', handleClearMenuForm);
    adminModal.saveSettingsBtn.addEventListener('click', saveAdminSettings);
}