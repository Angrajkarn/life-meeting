/**
 * Accessibility Utilities
 * 
 * WCAG 2.1 AA compliance helpers for enterprise video conferencing.
 * Includes keyboard navigation, screen reader support, and focus management.
 */

/**
 * Announce message to screen readers using live region
 * 
 * @param message - Message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const liveRegion = document.getElementById('a11y-live-region') || createLiveRegion();
  
  // Set priority
  liveRegion.setAttribute('aria-live', priority);
  
  // Announce message
  liveRegion.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 1000);
}

/**
 * Create hidden live region for screen reader announcements
 */
function createLiveRegion(): HTMLElement {
  const region = document.createElement('div');
  region.id = 'a11y-live-region';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  
  // Add screen reader only styles
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(region);
  return region;
}

/**
 * Trap focus within a container (for modals, dialogs)
 * 
 * @param container - Container element to trap focus in
 * @returns Cleanup function
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  firstElement?.focus();
  
  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Keyboard navigation handler for grid layouts
 * 
 * @param gridElement - Grid container element
 * @param columns - Number of columns in grid
 * @returns Cleanup function
 */
export function enableGridKeyboardNavigation(
  gridElement: HTMLElement,
  columns: number
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const tiles = Array.from(gridElement.querySelectorAll<HTMLElement>('[role="gridcell"]'));
    const currentIndex = tiles.findIndex(tile => tile === document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowRight':
        nextIndex = Math.min(currentIndex + 1, tiles.length - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(currentIndex + columns, tiles.length - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(currentIndex - columns, 0);
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tiles.length - 1;
        break;
      default:
        return;
    }
    
    if (nextIndex !== currentIndex) {
      e.preventDefault();
      tiles[nextIndex]?.focus();
    }
  };
  
  gridElement.addEventListener('keydown', handleKeyDown);
  
  return () => {
    gridElement.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Generate accessible label for video tile
 * 
 * @param participant - Participant info
 * @returns Accessible label string
 */
export function getVideoTileLabel(participant: {
  name: string;
  role: string;
  is_video_on: boolean;
  is_audio_on: boolean;
  is_speaking: boolean;
  is_hand_raised: boolean;
  presence: string;
}): string {
  const parts: string[] = [participant.name];
  
  if (participant.role !== 'participant') {
    parts.push(participant.role);
  }
  
  if (participant.is_speaking) {
    parts.push('speaking');
  }
  
  if (participant.is_hand_raised) {
    parts.push('hand raised');
  }
  
  parts.push(participant.is_video_on ? 'camera on' : 'camera off');
  parts.push(participant.is_audio_on ? 'microphone on' : 'microphone off');
  
  if (participant.presence === 'reconnecting') {
    parts.push('reconnecting');
  }
  
  return parts.join(', ');
}

/**
 * Add skip navigation link for accessibility
 * 
 * @param targetId - ID of main content area
 */
export function addSkipNavigation(targetId: string): void {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      z-index: 100;
    }
    .skip-link:focus {
      top: 0;
    }
  `;
  document.head.appendChild(style);
  
  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Ensure minimum contrast ratio (WCAG AA: 4.5:1 for normal text)
 * 
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns true if contrast meets WCAG AA standards
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5; // WCAG AA for normal text
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(hexColor: string): number {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 0;
  
  const [r, g, b] = rgb.map(val => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : null;
}

/**
 * Manage focus restoration after modal closes
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;

  /**
   * Save current focus before opening modal
   */
  saveFocus(): void {
    this.previousFocus = document.activeElement as HTMLElement;
  }

  /**
   * Restore focus after modal closes
   */
  restoreFocus(): void {
    if (this.previousFocus) {
      this.previousFocus.focus();
      this.previousFocus = null;
    }
  }
}
