/**
 * Material Definition System - Interactive Element Detection
 */

const INTERACTIVE_TAGS = ['button', 'a', 'input', 'select', 'textarea', 'label']
const INTERACTIVE_ROLES = ['button', 'link', 'tab', 'menuitem', 'option']

/**
 * Check if element should have interactive states (hover, press, drag)
 */
export function isInteractiveElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase()

  // Check tag name
  if (INTERACTIVE_TAGS.includes(tagName)) {
    return true
  }

  // Check role attribute
  const role = element.getAttribute('role')
  if (role && INTERACTIVE_ROLES.includes(role)) {
    return true
  }

  // Check tabindex (but not -1 which means not focusable)
  const tabindex = element.getAttribute('tabindex')
  if (tabindex && tabindex !== '-1') {
    return true
  }

  // Check for click handlers
  if (element.onclick || element.hasAttribute('onclick')) {
    return true
  }

  // Check for cursor pointer (developer intent)
  const cursor = getComputedStyle(element).cursor
  if (cursor === 'pointer') {
    return true
  }

  return false
}
