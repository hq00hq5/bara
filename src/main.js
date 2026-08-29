/**
 * Main Application Entry Point
 */

import './styles/index.css';
import { App } from './app.js';
import { initPWA } from './pwa/register-sw.js';

// Initialize PWA Service Worker
initPWA();

// Initialize the Platform Application
const app = new App('app');
app.init();
