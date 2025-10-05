/**
 * Material System
 * A material-driven styling system for modern web applications
 * @version 1.0.0
 * @license MIT
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.MaterialSystem = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MaterialSystem = {
    // Material registry
    registry: {},

    // Current theme
    _theme: 'light',

    // Transition duration for state changes
    transitionDuration: '0.3s',

    /**
     * Register a new material
     * @param {string} name - Material name
     * @param {object} properties - Material properties (can include base, hover, active, focus, disabled, dark, light)
     */
    register(name, properties) {
      this.registry[name] = properties;
      return this;
    },

    /**
     * Extend an existing material
     * @param {string} name - New material name
     * @param {string} baseMaterial - Base material to extend
     * @param {object} overrides - Properties to override
     */
    extend(name, baseMaterial, overrides = {}) {
      const base = this.registry[baseMaterial];
      if (!base) {
        console.warn(`MaterialSystem: Base material "${baseMaterial}" not found`);
        return this;
      }

      // Deep merge base with overrides
      this.registry[name] = this._deepMerge(base, overrides);
      return this;
    },

    /**
     * Apply materials to all elements with data-material attribute
     */
    apply() {
      document.querySelectorAll('[data-material]').forEach(element => {
        this.update(element);
      });
      return this;
    },

    /**
     * Update a single element
     * @param {HTMLElement} element - Element to update
     */
    update(element) {
      let materialName = element.getAttribute('data-material');

      // Handle design tokens (@token.path)
      if (materialName && materialName.startsWith('@')) {
        materialName = this._resolveToken(materialName);
      }

      const material = this.registry[materialName];
      if (!material) {
        return;
      }

      // Apply base styles
      const baseStyles = this._getStylesForState(material, 'base');
      this._applyStyles(element, baseStyles);

      // Add transition for smooth state changes
      if (!element.style.transition) {
        element.style.transition = `all ${this.transitionDuration} ease`;
      }

      // Setup state handlers
      this._setupStateHandlers(element, material);
    },

    /**
     * Set theme (dark or light)
     * @param {string} theme - 'dark' or 'light'
     */
    setTheme(theme) {
      if (theme !== 'dark' && theme !== 'light') {
        console.warn(`MaterialSystem: Invalid theme "${theme}". Use 'dark' or 'light'.`);
        return this;
      }

      this._theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      this.apply();
      return this;
    },

    /**
     * Get current theme
     * @returns {string} Current theme
     */
    getTheme() {
      return this._theme;
    },

    /**
     * Initialize the system
     */
    init() {
      // Register built-in materials
      this._registerBuiltInMaterials();

      // Apply materials on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.apply());
      } else {
        this.apply();
      }

      // Watch for dynamic content
      this._observeDOMChanges();

      return this;
    },

    /**
     * Get styles for a specific state
     * @private
     */
    _getStylesForState(material, state) {
      const baseStyles = material.base || {};
      const themeStyles = material[this._theme] || {};
      const stateStyles = material[state] || {};

      // Get theme-specific state styles (e.g., dark.hover, light.disabled)
      const themeStateStyles = (material[this._theme] && material[this._theme][state]) || {};

      // Merge: base → state → theme → themeState
      // This ensures theme can override base, and theme-specific states override generic states
      return { ...baseStyles, ...stateStyles, ...themeStyles, ...themeStateStyles };
    },

    /**
     * Apply styles to element
     * @private
     */
    _applyStyles(element, styles) {
      Object.keys(styles).forEach(prop => {
        if (prop !== 'base' && prop !== 'hover' && prop !== 'active' &&
            prop !== 'focus' && prop !== 'disabled' &&
            prop !== 'dark' && prop !== 'light') {
          // Handle both camelCase and kebab-case properties
          // Convert camelCase to kebab-case if needed (e.g., backgroundColor -> background-color)
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          element.style.setProperty(cssProp, styles[prop]);
        }
      });
    },

    /**
     * Check if element is interactive (should have hover/active states)
     * @private
     */
    _isInteractiveElement(element) {
      const interactiveTags = ['button', 'a', 'input', 'select', 'textarea', 'label'];
      const tagName = element.tagName.toLowerCase();

      // Check if it's a native interactive element
      if (interactiveTags.includes(tagName)) {
        return true;
      }

      // Check if it has role="button" or tabindex (custom interactive elements)
      if (element.hasAttribute('role') && ['button', 'link', 'tab'].includes(element.getAttribute('role'))) {
        return true;
      }

      // Check if it has tabindex (focusable = interactive)
      if (element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1') {
        return true;
      }

      // Check if it has onclick handler (likely interactive)
      if (element.onclick || element.hasAttribute('onclick')) {
        return true;
      }

      return false;
    },

    /**
     * Setup state handlers (hover, active, focus, disabled)
     * @private
     */
    _setupStateHandlers(element, material) {
      // Remove existing handlers
      element._materialHandlers?.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });

      const handlers = [];

      // Check if element is interactive (only apply hover/active to interactive elements)
      const isInteractive = this._isInteractiveElement(element);

      // Hover state (only for interactive elements)
      if (material.hover && isInteractive) {
        const mouseEnter = () => {
          if (!element.disabled) {
            const hoverStyles = this._getStylesForState(material, 'hover');
            this._applyStyles(element, hoverStyles);
          }
        };
        const mouseLeave = () => {
          if (!element.disabled) {
            const baseStyles = this._getStylesForState(material, 'base');
            this._applyStyles(element, baseStyles);
          }
        };
        element.addEventListener('mouseenter', mouseEnter);
        element.addEventListener('mouseleave', mouseLeave);
        handlers.push({ event: 'mouseenter', handler: mouseEnter });
        handlers.push({ event: 'mouseleave', handler: mouseLeave });
      }

      // Active state (only for interactive elements)
      if (material.active && isInteractive) {
        const mouseDown = () => {
          if (!element.disabled) {
            const activeStyles = this._getStylesForState(material, 'active');
            this._applyStyles(element, activeStyles);
          }
        };
        const mouseUp = () => {
          if (!element.disabled) {
            const hoverStyles = material.hover
              ? this._getStylesForState(material, 'hover')
              : this._getStylesForState(material, 'base');
            this._applyStyles(element, hoverStyles);
          }
        };
        element.addEventListener('mousedown', mouseDown);
        element.addEventListener('mouseup', mouseUp);
        handlers.push({ event: 'mousedown', handler: mouseDown });
        handlers.push({ event: 'mouseup', handler: mouseUp });
      }

      // Focus state
      if (material.focus) {
        const focus = () => {
          if (!element.disabled) {
            const focusStyles = this._getStylesForState(material, 'focus');
            this._applyStyles(element, focusStyles);
          }
        };
        const blur = () => {
          if (!element.disabled) {
            const baseStyles = this._getStylesForState(material, 'base');
            this._applyStyles(element, baseStyles);
          }
        };
        element.addEventListener('focus', focus);
        element.addEventListener('blur', blur);
        handlers.push({ event: 'focus', handler: focus });
        handlers.push({ event: 'blur', handler: blur });
      }

      // Disabled state
      if (element.disabled && material.disabled) {
        const disabledStyles = this._getStylesForState(material, 'disabled');
        this._applyStyles(element, disabledStyles);
      }

      // Store handlers for cleanup
      element._materialHandlers = handlers;
    },

    /**
     * Resolve design token to material name
     * @private
     */
    _resolveToken(token) {
      const path = token.substring(1).split('.');
      let value = this.tokens;

      for (const key of path) {
        value = value[key];
        if (value === undefined) {
          console.warn(`MaterialSystem: Token "${token}" not found`);
          return null;
        }
      }

      return value;
    },

    /**
     * Deep merge objects
     * @private
     */
    _deepMerge(target, source) {
      const result = { ...target };

      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this._deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      });

      return result;
    },

    /**
     * Observe DOM changes for dynamic content
     * @private
     */
    _observeDOMChanges() {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          // Handle attribute changes
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-material') {
            this.update(mutation.target);
          }

          // Handle added nodes
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              if (node.hasAttribute('data-material')) {
                this.update(node);
              }
              // Check children
              node.querySelectorAll('[data-material]').forEach(child => {
                this.update(child);
              });
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-material']
      });
    },

    /**
     * Register built-in materials
     * @private
     */
    _registerBuiltInMaterials() {
      // Glass material - Apple Liquid Glass (Dark mode default)
      this.register('glass', {
        base: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '0.5px solid rgba(255, 255, 255, 0.25)',
          borderTop: '1px solid rgba(255, 255, 255, 0.4)',
          color: '#ffffff',
          // 10-layer shadow system: inner border + reflex layers + depth shadows
          boxShadow: `
            inset 0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.9),
            inset -2px -2px 0px -2px rgba(255, 255, 255, 0.8),
            inset -3px -8px 1px -6px rgba(255, 255, 255, 0.6),
            inset -0.3px -1px 4px 0px rgba(0, 0, 0, 0.12),
            inset -1.5px 2.5px 0px -2px rgba(0, 0, 0, 0.2),
            inset 0px 3px 4px -2px rgba(0, 0, 0, 0.2),
            inset 2px -6.5px 1px -4px rgba(0, 0, 0, 0.1),
            0px 1px 5px 0px rgba(0, 0, 0, 0.2),
            0px 6px 16px 0px rgba(0, 0, 0, 0.16)
          `,
          transition: 'background-color 400ms cubic-bezier(1, 0, 0.4, 1), box-shadow 400ms cubic-bezier(1, 0, 0.4, 1)'
        },
        hover: {
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          borderTop: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: `
            inset 0 0 0 1px rgba(255, 255, 255, 0.25),
            inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.95),
            inset -2px -2px 0px -2px rgba(255, 255, 255, 0.85),
            inset -3px -8px 1px -6px rgba(255, 255, 255, 0.65),
            inset -0.3px -1px 4px 0px rgba(0, 0, 0, 0.14),
            inset -1.5px 2.5px 0px -2px rgba(0, 0, 0, 0.22),
            inset 0px 3px 4px -2px rgba(0, 0, 0, 0.22),
            inset 2px -6.5px 1px -4px rgba(0, 0, 0, 0.12),
            0px 2px 8px 0px rgba(0, 0, 0, 0.22),
            0px 8px 20px 0px rgba(0, 0, 0, 0.18)
          `,
          transform: 'translateY(-2px)'
        },
        active: {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          transform: 'translateY(0) scale(0.98)'
        },
        disabled: {
          opacity: '0.5',
          cursor: 'not-allowed'
        },
        // Light mode override
        light: {
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px) ',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.5)',
          color: '#224',
          boxShadow: `
            inset 0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.9),
            inset -2px -2px 0px -2px rgba(255, 255, 255, 0.8),
            inset -3px -8px 1px -6px rgba(255, 255, 255, 0.6),
            inset -0.3px -1px 4px 0px rgba(0, 0, 0, 0.036),
            inset -1.5px 2.5px 0px -2px rgba(0, 0, 0, 0.06),
            inset 0px 3px 4px -2px rgba(0, 0, 0, 0.06),
            inset 2px -6.5px 1px -4px rgba(0, 0, 0, 0.03),
            0px 1px 5px 0px rgba(0, 0, 0, 0.06),
            0px 6px 16px 0px rgba(0, 0, 0, 0.048)
          `,
          hover: {
            backgroundColor: 'rgba(0, 0, 0, 0.18)',
            borderTop: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: `
              inset 0 0 0 1px rgba(255, 255, 255, 0.25),
              inset 1.8px 3px 0px -2px rgba(255, 255, 255, 0.95),
              inset -2px -2px 0px -2px rgba(255, 255, 255, 0.85),
              inset -3px -8px 1px -6px rgba(255, 255, 255, 0.65),
              inset -0.3px -1px 4px 0px rgba(0, 0, 0, 0.042),
              inset -1.5px 2.5px 0px -2px rgba(0, 0, 0, 0.066),
              inset 0px 3px 4px -2px rgba(0, 0, 0, 0.066),
              inset 2px -6.5px 1px -4px rgba(0, 0, 0, 0.036),
              0px 2px 8px 0px rgba(0, 0, 0, 0.066),
              0px 8px 20px 0px rgba(0, 0, 0, 0.054)
            `
          },
          active: {
            backgroundColor: 'rgba(0, 0, 0, 0.08)'
          }
        }
      });
      // Paper material
      this.register('paper', {
        base: {
          background: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3CfeColorMatrix values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0.02 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' /%3E%3C/svg%3E"), #ffffff`,
          backgroundSize: '200px 200px, 100% 100%',
          border: '0.5px solid rgba(0, 0, 0, 0.08)',
          color: '#2d1b3d'
        },
        hover: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(-2px)'
        },
        active: {
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(0) scale(0.98)'
        },
        disabled: {
          opacity: '0.6',
          cursor: 'not-allowed'
        },
        dark: {
          background: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.015 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' /%3E%3C/svg%3E"), #1a1a1a`,
          backgroundSize: '200px 200px, 100% 100%',
          color: '#e0e0e0',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
        }
      });
    }
  };

  // Auto-initialize when loaded in browser
  if (typeof window !== 'undefined') {
    MaterialSystem.init();
  }

  return MaterialSystem;
}));
