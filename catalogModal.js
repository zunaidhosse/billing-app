// catalogModal.js
import { DOMElements } from './ui.js';
import { openModal } from './modal-utils.js';
import { renderMenuEditorUI, selectMenuItemForEdit, clearMenuForm, saveMenuItem, deleteMenuItem } from './menu-management.js';

// --- Helper for Menu Editor ---
function getMenuEditorFormElements() {
    const { catalogModal } = DOMElements;
    return {
        idInput: catalogModal.itemId,
        nameInput: catalogModal.itemName,
        categoryInput: catalogModal.itemCategory,
        priceInput: catalogModal.itemPrice,
        listElement: catalogModal.itemList
    };
}

// --- Menu Management ---
function renderCatalogEditor() {
    renderMenuEditorUI(DOMElements.catalogModal.itemList, handleSelectCatalogItem, handleDeleteCatalogItem);
}

function handleSelectCatalogItem(itemId) {
    selectMenuItemForEdit(itemId, getMenuEditorFormElements());
}

async function handleSaveCatalogItem() {
    const success = await saveMenuItem(getMenuEditorFormElements());
    if (success) {
        renderCatalogEditor();
        clearMenuForm(getMenuEditorFormElements());
    }
}

async function handleDeleteCatalogItem(itemId) {
    const success = await deleteMenuItem(itemId);
    if (success) {
        renderCatalogEditor();
        clearMenuForm(getMenuEditorFormElements());
    }
}

function handleClearCatalogForm() {
    clearMenuForm(getMenuEditorFormElements());
}

// --- Public Functions ---
export function openCatalogModal() {
    renderCatalogEditor();
    openModal(DOMElements.catalogModal.modal);
}

export function initCatalogModalListeners() {
    const { catalogModal } = DOMElements;
    catalogModal.saveBtn.addEventListener('click', handleSaveCatalogItem);
    catalogModal.clearBtn.addEventListener('click', handleClearCatalogForm);
}

