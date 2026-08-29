/**
 * SPA Router
 * Lightweight client-side router using History API.
 * Manages navigation without page reloads and prevents browser back
 * from exposing secret player screens.
 */

class Router {
  constructor() {
    this.routes = new Map();
    this.currentPath = null;
    this.beforeEach = null;

    // Intercept browser back button
    window.addEventListener('popstate', () => {
      // Push current state back to prevent going back
      if (this.currentPath) {
        history.pushState({ path: this.currentPath }, '', this.currentPath);
      }
    });
  }

  /**
   * Define a route
   * @param {string} path
   * @param {Function} handler - Called with (params) when route matches
   */
  on(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  /**
   * Navigate to a path
   * @param {string} path
   * @param {Object} params - Optional data to pass to the route handler
   */
  navigate(path, params = {}) {
    this.currentPath = path;
    history.pushState({ path, params }, '', path);
    this._dispatch(path, params);
  }

  /**
   * Replace current history entry (no back entry)
   */
  replace(path, params = {}) {
    this.currentPath = path;
    history.replaceState({ path, params }, '', path);
    this._dispatch(path, params);
  }

  /**
   * Dispatch to matched route handler
   */
  _dispatch(path, params = {}) {
    // Try exact match first
    if (this.routes.has(path)) {
      this.routes.get(path)(params);
      return;
    }
    // Try prefix match for nested routes
    for (const [route, handler] of this.routes) {
      if (path.startsWith(route + '/') || path === route) {
        handler(params);
        return;
      }
    }
    // Fallback to root
    if (this.routes.has('/')) {
      this.routes.get('/')(params);
    }
  }

  /**
   * Initialize router from current URL
   */
  init() {
    const path = window.location.pathname || '/';
    this._dispatch(path);
  }
}

export const router = new Router();
