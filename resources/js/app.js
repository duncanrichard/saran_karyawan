import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import AuthPortal from './AuthPortal';

const root = document.getElementById('employee-portal');

if (root) {
    createRoot(root).render(createElement(AuthPortal));
}
