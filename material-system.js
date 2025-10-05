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

    // Design tokens
    tokens: {
      surface: {
        primary: 'glass',
        secondary: 'paper',
        elevated: 'metal'
      },
      interactive: {
        default: 'metal',
        primary: 'glass',
        secondary: 'paper'
      }
    },

    // Current theme
    _theme: 'dark',

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
     * Setup state handlers (hover, active, focus, disabled)
     * @private
     */
    _setupStateHandlers(element, material) {
      // Remove existing handlers
      element._materialHandlers?.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });

      const handlers = [];

      // Hover state
      if (material.hover) {
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

      // Active state
      if (material.active) {
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
      // Glass material - Apple Liquid Glass (with original borders + reactive transparency)
      this.register('glass', {
        base: {
          backgroundColor: 'color-mix(in srgb, var(--c-glass) 12%, transparent)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(var(--saturation))',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--saturation))',
          border: '1px solid var(--glass-border)',
          borderTop: '1px solid var(--glass-border-top)',
          color: 'var(--c-content)',
          // Original shadows - inner border + reflex layers + depth shadows
          boxShadow: `
            inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 20%), transparent),
            inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 90%), transparent),
            inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 80%), transparent),
            inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 60%), transparent),
            inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent),
            inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
            inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
            inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 10%), transparent),
            0px 1px 5px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 20%), transparent),
            0px 6px 16px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 16%), transparent)
          `,
          transition: 'background-color 400ms cubic-bezier(1, 0, 0.4, 1), box-shadow 400ms cubic-bezier(1, 0, 0.4, 1)'
        },
        hover: {
          backgroundColor: 'color-mix(in srgb, var(--c-glass) 18%, transparent)',
          borderTop: '1px solid var(--glass-border-hover)',
          boxShadow: `
            inset 0 0 0 1px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 25%), transparent),
            inset 1.8px 3px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 95%), transparent),
            inset -2px -2px 0px -2px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 85%), transparent),
            inset -3px -8px 1px -6px color-mix(in srgb, var(--c-light) calc(var(--glass-reflex-light) * 65%), transparent),
            inset -0.3px -1px 4px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 14%), transparent),
            inset -1.5px 2.5px 0px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 22%), transparent),
            inset 0px 3px 4px -2px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 22%), transparent),
            inset 2px -6.5px 1px -4px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 12%), transparent),
            0px 2px 8px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 22%), transparent),
            0px 8px 20px 0px color-mix(in srgb, var(--c-dark) calc(var(--glass-reflex-dark) * 18%), transparent)
          `,
          transform: 'translateY(-2px)'
        },
        active: {
          backgroundColor: 'color-mix(in srgb, var(--c-glass) 8%, transparent)',
          transform: 'translateY(0) scale(0.98)'
        },
        disabled: {
          opacity: '0.5',
          cursor: 'not-allowed'
        }
      });

      // Metal material
      this.register('metal', {
        base: {
          background: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='diamond' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,20 L20,0 L40,20 L20,40 Z' fill='none' stroke='%23000' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M20,20 L30,10 M20,20 L10,10 M20,20 L10,30 M20,20 L30,30' stroke='%23fff' stroke-width='0.3' opacity='0.1'/%3E%3Cellipse cx='20' cy='20' rx='2' ry='3' fill='%23fff' opacity='0.15'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='40' height='40' fill='url(%23diamond)'/%3E%3C/svg%3E"), linear-gradient(135deg, #434343 0%, #282828 100%)`,
          backgroundSize: '40px 40px, 100% 100%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          color: '#e0e0e0'
        },
        hover: {
          background: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='diamond' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,20 L20,0 L40,20 L20,40 Z' fill='none' stroke='%23000' stroke-width='0.5' opacity='0.15'/%3E%3Cpath d='M20,20 L30,10 M20,20 L10,10 M20,20 L10,30 M20,20 L30,30' stroke='%23fff' stroke-width='0.3' opacity='0.15'/%3E%3Cellipse cx='20' cy='20' rx='2' ry='3' fill='%23fff' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='40' height='40' fill='url(%23diamond)'/%3E%3C/svg%3E"), linear-gradient(135deg, #4a4a4a 0%, #2f2f2f 100%)`,
          backgroundSize: '40px 40px, 100% 100%',
          boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          transform: 'translateY(-2px)'
        },
        active: {
          background: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='diamond' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,20 L20,0 L40,20 L20,40 Z' fill='none' stroke='%23000' stroke-width='0.5' opacity='0.2'/%3E%3Cpath d='M20,20 L30,10 M20,20 L10,10 M20,20 L10,30 M20,20 L30,30' stroke='%23fff' stroke-width='0.3' opacity='0.05'/%3E%3Cellipse cx='20' cy='20' rx='2' ry='3' fill='%23fff' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='40' height='40' fill='url(%23diamond)'/%3E%3C/svg%3E"), linear-gradient(135deg, #383838 0%, #232323 100%)`,
          backgroundSize: '40px 40px, 100% 100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          transform: 'translateY(0) scale(0.98)'
        },
        disabled: {
          opacity: '0.5',
          cursor: 'not-allowed'
        },
        light: {
          background: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='diamond-light' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,20 L20,0 L40,20 L20,40 Z' fill='none' stroke='%23000' stroke-width='0.5' opacity='0.08'/%3E%3Cpath d='M20,20 L30,10 M20,20 L10,10 M20,20 L10,30 M20,20 L30,30' stroke='%23fff' stroke-width='0.3' opacity='0.4'/%3E%3Cellipse cx='20' cy='20' rx='2' ry='3' fill='%23fff' opacity='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='40' height='40' fill='url(%23diamond-light)'/%3E%3C/svg%3E"), linear-gradient(135deg, #e0e0e0 0%, #c0c0c0 100%)`,
          backgroundSize: '40px 40px, 100% 100%',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          color: '#2d1b3d'
        }
      });

      // Paper material
      this.register('paper', {
        base: {
          background: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' /%3E%3CfeColorMatrix values='0 0 0 0 0, 0 0 0 0 0, 0 0 0 0 0, 0 0 0 0.02 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noise)' /%3E%3C/svg%3E"), #ffffff`,
          backgroundSize: '200px 200px, 100% 100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
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

      // Wood material
      this.register('wood', {
        base: {
          background: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='wood' width='20' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,0 Q5,25 0,50 T0,100' stroke='%23654321' stroke-width='0.5' fill='none' opacity='0.3'/%3E%3Cpath d='M10,0 Q15,25 10,50 T10,100' stroke='%23654321' stroke-width='0.8' fill='none' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23wood)'/%3E%3C/svg%3E"), radial-gradient(ellipse 80px 120px at 30% 40%, rgba(101, 67, 33, 0.4) 0%, transparent 50%), radial-gradient(ellipse 60px 90px at 70% 60%, rgba(80, 50, 25, 0.5) 0%, transparent 40%), linear-gradient(90deg, #8B7355 0%, #6F5643 25%, #8B7355 50%, #6F5643 75%, #8B7355 100%)`,
          backgroundSize: '200px 200px, 100% 100%, 100% 100%, 100% 100%',
          boxShadow: 'inset 0 0 60px rgba(101, 67, 33, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(70, 50, 30, 0.6)',
          color: '#f5e6d3'
        },
        hover: {
          boxShadow: 'inset 0 0 60px rgba(101, 67, 33, 0.35), 0 6px 18px rgba(0, 0, 0, 0.5)',
          transform: 'translateY(-2px)',
          filter: 'brightness(1.1)'
        },
        active: {
          boxShadow: 'inset 0 0 40px rgba(101, 67, 33, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)',
          transform: 'translateY(0) scale(0.98)',
          filter: 'brightness(0.95)'
        },
        disabled: {
          opacity: '0.5',
          cursor: 'not-allowed'
        },
        light: {
          background: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='wood' width='20' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0,0 Q5,25 0,50 T0,100' stroke='%23A07850' stroke-width='0.5' fill='none' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23wood)'/%3E%3C/svg%3E"), radial-gradient(ellipse 70px 100px at 35% 45%, rgba(160, 120, 80, 0.3) 0%, transparent 50%), linear-gradient(90deg, #D4A574 0%, #C19463 50%, #D4A574 100%)`,
          backgroundSize: '200px 200px, 100% 100%, 100% 100%',
          border: '1px solid rgba(140, 100, 60, 0.4)',
          boxShadow: 'inset 0 0 40px rgba(160, 120, 80, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)',
          color: '#4a3a2a'
        }
      });

      // Fabric material
      this.register('fabric', {
        base: {
          background: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='20' height='20' fill='%23f5e6d9'/%3E%3Cpath d='M0,0 L20,0 M0,10 L20,10 M0,20 L20,20' stroke='%23000' stroke-width='0.5' opacity='0.05'/%3E%3Cpath d='M0,0 L0,20 M10,0 L10,20 M20,0 L20,20' stroke='%23000' stroke-width='0.5' opacity='0.05'/%3E%3C/svg%3E"), linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.02) 48%, rgba(0,0,0,0.02) 52%, transparent 52%)`,
          backgroundSize: '20px 20px, 10px 10px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          color: '#3d3d3d'
        },
        hover: {
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2)',
          transform: 'translateY(-2px)'
        },
        active: {
          boxShadow: '0 1px 6px rgba(0, 0, 0, 0.15)',
          transform: 'translateY(0) scale(0.98)'
        },
        disabled: {
          opacity: '0.6',
          cursor: 'not-allowed'
        },
        dark: {
          background: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='20' height='20' fill='%233a2f26'/%3E%3Cpath d='M0,0 L20,0 M0,10 L20,10 M0,20 L20,20' stroke='%23fff' stroke-width='0.5' opacity='0.03'/%3E%3Cpath d='M0,0 L0,20 M10,0 L10,20 M20,0 L20,20' stroke='%23fff' stroke-width='0.5' opacity='0.03'/%3E%3C/svg%3E"), linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.02) 48%, rgba(255,255,255,0.02) 52%, transparent 52%)`,
          backgroundSize: '20px 20px, 10px 10px',
          color: '#e8d5c4',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)'
        }
      });

      // Holographic material - Experimental iridescent effect
      this.register('holo', {
        base: {
          background: `
            linear-gradient(125deg,
              rgba(255, 0, 200, 0.3) 0%,
              rgba(0, 200, 255, 0.3) 25%,
              rgba(0, 255, 150, 0.3) 50%,
              rgba(255, 200, 0, 0.3) 75%,
              rgba(255, 0, 200, 0.3) 100%
            ),
            linear-gradient(45deg,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 100%
            ),
            rgba(0, 0, 0, 0.3)
          `,
          backgroundSize: '400% 100%, 100% 100%, 100% 100%',
          backdropFilter: 'blur(10px) saturate(200%)',
          WebkitBackdropFilter: 'blur(10px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#ffffff',
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3),
            0 4px 16px rgba(200, 0, 255, 0.3),
            0 8px 32px rgba(0, 200, 255, 0.2)
          `,
          transition: 'all 0.3s ease, background-position 0.8s ease'
        },
        hover: {
          backgroundPosition: '100% 0%, 0% 0%, 0% 0%',
          backdropFilter: 'blur(15px) saturate(250%)',
          WebkitBackdropFilter: 'blur(15px) saturate(250%)',
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 0.6),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3),
            0 6px 20px rgba(200, 0, 255, 0.4),
            0 12px 40px rgba(0, 200, 255, 0.3)
          `,
          transform: 'translateY(-2px) scale(1.02)'
        },
        active: {
          transform: 'translateY(0) scale(0.98)',
          backdropFilter: 'blur(8px) saturate(180%)',
          WebkitBackdropFilter: 'blur(8px) saturate(180%)'
        },
        disabled: {
          opacity: '0.5',
          cursor: 'not-allowed'
        },
        light: {
          background: `
            linear-gradient(125deg,
              rgba(255, 0, 200, 0.15) 0%,
              rgba(0, 200, 255, 0.15) 25%,
              rgba(0, 255, 150, 0.15) 50%,
              rgba(255, 200, 0, 0.15) 75%,
              rgba(255, 0, 200, 0.15) 100%
            ),
            linear-gradient(45deg,
              rgba(255, 255, 255, 0.4) 0%,
              rgba(255, 255, 255, 0.2) 100%
            ),
            rgba(255, 255, 255, 0.5)
          `,
          backgroundSize: '400% 100%, 100% 100%, 100% 100%',
          color: '#1a1a1a',
          border: '1px solid rgba(200, 0, 255, 0.3)',
          boxShadow: `
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1),
            0 4px 16px rgba(200, 0, 255, 0.2),
            0 8px 32px rgba(0, 200, 255, 0.1)
          `
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
