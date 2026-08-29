/**
 * Generic Finite State Machine
 * Powers all game state transitions.
 * Reusable across all game modules.
 */
export class StateMachine {
  /**
   * @param {Object} config
   * @param {string} config.initial - Initial state
   * @param {Object} config.states - State definitions
   * @param {Object} config.transitions - Allowed transitions { from: { event: to } }
   * @param {Function} [config.onTransition] - Called on every valid transition
   */
  constructor(config) {
    this.current = config.initial;
    this.states = config.states || {};
    this.transitions = config.transitions || {};
    this.onTransition = config.onTransition || null;
    this.history = [config.initial];
    this._listeners = new Map();
  }

  /**
   * Send an event to trigger a transition
   * @param {string} event
   * @param {*} payload - Optional data passed to the new state's onEnter
   * @returns {boolean} Whether the transition occurred
   */
  send(event, payload = null) {
    const stateTransitions = this.transitions[this.current];
    if (!stateTransitions) return false;

    const nextState = stateTransitions[event];
    if (!nextState) return false;

    const prevState = this.current;

    // Call onExit of current state
    if (this.states[prevState]?.onExit) {
      this.states[prevState].onExit(payload);
    }

    this.current = nextState;
    this.history.push(nextState);

    // Call onEnter of new state
    if (this.states[nextState]?.onEnter) {
      this.states[nextState].onEnter(payload);
    }

    // Global transition callback
    if (this.onTransition) {
      this.onTransition({ from: prevState, to: nextState, event, payload });
    }

    // Notify listeners
    this._notifyListeners(nextState, { from: prevState, event, payload });

    return true;
  }

  /**
   * Subscribe to state changes
   * @param {string} state - State to listen for ('*' for all)
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  on(state, callback) {
    if (!this._listeners.has(state)) {
      this._listeners.set(state, new Set());
    }
    this._listeners.get(state).add(callback);
    return () => this._listeners.get(state)?.delete(callback);
  }

  /**
   * Check if a transition is valid from current state
   */
  can(event) {
    return !!(this.transitions[this.current]?.[event]);
  }

  /**
   * Get current state
   */
  getState() {
    return this.current;
  }

  /**
   * Force set state (use sparingly — only for initialization/reset)
   */
  reset(state) {
    this.current = state;
    this.history = [state];
  }

  _notifyListeners(state, data) {
    // Specific state listeners
    this._listeners.get(state)?.forEach((cb) => cb(data));
    // Wildcard listeners
    this._listeners.get('*')?.forEach((cb) => cb({ state, ...data }));
  }
}
