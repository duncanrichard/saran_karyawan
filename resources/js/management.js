import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import ManagementPortal from './ManagementPortal';

const root = document.getElementById('management-portal');

if (root) {
    createRoot(root).render(createElement(ManagementPortal));
}
