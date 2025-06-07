// menu-management.js
import { state, getMenuItem } from './state.js';
import { render, formatCurrency } from './ui.js';
import { saveMenuItem as dbSaveMenuItem, deleteMenuItem as dbDeleteMenuItem } from './db.js';

/**
 * Renders a generic menu editor list into a provided container.
 * @param {HTMLElement} listElement - The container for the list.
 * @param {function} itemClickHandler - Callback for when an item is clicked for editing.
 * @param {function} itemDeleteHandler - Callback for when an item's delete button is clicked.
 */
export function renderMenuEditorUI(listElement, itemClickHandler, itemDeleteHandler) {
    listElement.innerHTML = '';
    const sortedMenu = [...state.menu].sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    sortedMenu.forEach(item => {
        const el = document.createElement('div');
        el.className = 'menu-editor-item';
        el.dataset.itemId = item.id;
        el.innerHTML = `
            <div class="menu-editor-item-details">
                <span>${item.name} (${item.category})</span>
                <span>${formatCurrency(item.price)}</span>
            </div>
            <div class="menu-editor-item-actions">
                <button class="delete-menu-item-btn"><img src="trash.png" alt="Delete"></button>
            </div>
        `;

        el.querySelector('.menu-editor-item-details').addEventListener('click', () => itemClickHandler(item.id));
        el.querySelector('.delete-menu-item-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            itemDeleteHandler(item.id);
        });
        listElement.appendChild(el);
    });
}

/**
 * Populates a form with the details of a selected menu item.
 * @param {number} itemId - The ID of the item to edit.
 * @param {object} formElements - An object containing the form's input elements.
 */
export function selectMenuItemForEdit(itemId, formElements) {
    const item = getMenuItem(itemId);
    formElements.idInput.value = item.id;
    formElements.nameInput.value = item.name;
    formElements.categoryInput.value = item.category;
    formElements.priceInput.value = item.price;
    
    formElements.listElement.querySelectorAll('.menu-editor-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.itemId == itemId);
    });
}

/**
 * Clears the menu item form.
 * @param {object} formElements - An object containing the form's input elements.
 */
export function clearMenuForm(formElements) {
    formElements.idInput.value = '';
    formElements.nameInput.value = '';
    formElements.categoryInput.value = '';
    formElements.priceInput.value = '';
    formElements.listElement.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    formElements.nameInput.focus();
}

/**
 * Saves a new or existing menu item to the database.
 * @param {object} formElements - An object containing the form's input elements.
 * @returns {Promise<boolean>} - True if save was successful, false otherwise.
 */
export async function saveMenuItem(formElements) {
    const id = parseInt(formElements.idInput.value, 10);
    const name = formElements.nameInput.value.trim();
    const category = formElements.categoryInput.value.trim();
    const price = parseFloat(formElements.priceInput.value);

    if (!name || !category || isNaN(price)) {
        alert('Please fill all fields correctly.');
        return false;
    }

    if (id) { // Edit existing
        const item = getMenuItem(id);
        item.name = name;
        item.category = category;
        item.price = price;
        await dbSaveMenuItem(item);
    } else { // Add new
        const newId = state.menu.length > 0 ? Math.max(...state.menu.map(i => i.id)) + 1 : 1;
        const newItem = { id: newId, name, category, price };
        state.menu.push(newItem);
        await dbSaveMenuItem(newItem);
    }
    
    if(state.currentView === 'order') {
        render();
    }
    return true;
}

/**
 * Deletes a menu item from the database.
 * @param {number} itemId - The ID of the item to delete.
 * @returns {Promise<boolean>} - True if delete was successful, false otherwise.
 */
export async function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        await dbDeleteMenuItem(itemId);
        state.menu = state.menu.filter(i => i.id !== itemId);
        
        if (state.currentView === 'order') {
            render();
        }
        return true;
    }
    return false;
}