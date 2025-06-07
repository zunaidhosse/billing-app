// modal-utils.js
import { DOMElements } from './ui.js';

export function openModal(modal) {
    modal.classList.remove('hidden');
    DOMElements.modalBackdrop.classList.remove('hidden');
}

export function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    // If no other modals are open, hide backdrop
    if (!document.querySelector('.modal:not(.hidden)')) {
        DOMElements.modalBackdrop.classList.add('hidden');
    }
}

export function closeParentModal(event) {
    closeModal(event.target.closest('.modal'));
}

export function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    DOMElements.modalBackdrop.classList.add('hidden');
}

