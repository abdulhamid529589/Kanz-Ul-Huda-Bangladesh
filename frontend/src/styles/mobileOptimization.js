/**
 * Mobile Optimization Guide
 *
 * This file documents mobile-optimized layout patterns used throughout the app.
 * Apply these patterns when creating or updating components.
 */

/**
 * RESPONSIVE BREAKPOINTS (Tailwind)
 * - Mobile: < 640px (default styling)
 * - sm: 640px - 767px (landscape mobile, small tablet)
 * - md: 768px - 1023px (tablet)
 * - lg: 1024px+ (desktop)
 */

/**
 * TOUCH-FRIENDLY SIZES
 * - Minimum tap target: 44x44px (Tailwind: py-2.5 px-3 or h-11 w-11)
 * - Spacing: Use rem units (Tailwind: gap-2, gap-3, gap-4)
 * - Padding: p-3 (mobile) → p-4 (tablet) → p-6 (desktop)
 */

/**
 * RESPONSIVE TEXT
 * - Headings: text-xl sm:text-2xl md:text-3xl lg:text-4xl
 * - Body: text-sm sm:text-base md:text-base
 * - Labels: text-xs sm:text-sm
 */

/**
 * RESPONSIVE LAYOUT PATTERNS
 */

// 1. Single Column → Multi Column
export const gridPatterns = {
  // Mobile: 1 col, Tablet: 2 col, Desktop: 3 col
  responsive2Col: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4',

  // Mobile: 1 col, Tablet/Desktop: 2 col
  responsive1Col: 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4',

  // Mobile: Stack, Desktop: Horizontal
  flexResponsive: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
}

// 2. Responsive Container Widths
export const containerPatterns = {
  // Full width on mobile, fixed on desktop
  full: 'w-full px-3 sm:px-4 md:px-0 md:w-full md:max-w-7xl md:mx-auto',

  // Sidebar + Content
  withSidebar: 'flex gap-3 sm:gap-4',
  sidebar: 'w-full sm:w-48 md:w-64 flex-shrink-0',
  content: 'flex-1 min-w-0', // min-w-0 prevents flex overflow
}

// 3. Responsive Navigation
export const navPatterns = {
  // Hide text on mobile, show icon only
  mobileIcon: 'hidden sm:inline-block',
  desktopText: 'text-xs sm:text-sm',

  // Bottom nav on mobile, top nav on desktop
  bottomNavMobile: 'fixed bottom-0 left-0 right-0 md:relative md:bottom-auto',
}

// 4. Responsive Typography
export const typePatterns = {
  heading: 'text-lg sm:text-xl md:text-2xl font-semibold',
  subheading: 'text-base sm:text-lg font-medium',
  body: 'text-sm sm:text-base leading-relaxed',
  caption: 'text-xs sm:text-sm text-gray-600',
}

// 5. Responsive Forms
export const formPatterns = {
  input: 'w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm border rounded-lg',
  button: 'px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium rounded-lg',
  label: 'text-xs sm:text-sm font-medium mb-1.5 sm:mb-2',
}

// 6. Responsive Spacing
export const spacingPatterns = {
  pageMargin: 'mx-3 sm:mx-4 md:mx-0',
  sectionGap: 'gap-3 sm:gap-4 md:gap-6',
  elementGap: 'gap-2 sm:gap-3',
}

/**
 * MOBILE-SPECIFIC PATTERNS
 */

// 1. Overlay/Modal handling on mobile
export const mobileModal = {
  overlay: 'fixed inset-0 bg-black bg-opacity-50 z-40',
  modal:
    'fixed inset-x-3 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bg-white rounded-t-lg sm:rounded-lg z-50 max-h-[90vh] sm:max-h-96',
}

// 2. Horizontal scrolling for mobile
export const scrollPatterns = {
  horizontalScroll: 'overflow-x-auto sm:overflow-x-visible scrollbar-hide',
  scrollSnap: 'snap-x snap-mandatory',
  scrollItem: 'snap-start flex-shrink-0',
}

// 3. Conditional display
export const displayPatterns = {
  mobileOnly: 'block md:hidden',
  desktopOnly: 'hidden md:block',
  desktopInline: 'hidden sm:inline-block',
  mobileBlock: 'block sm:inline',
}

/**
 * IMPLEMENTATION CHECKLIST
 *
 * For each component:
 * ✓ Test on: Mobile (360px), Tablet (768px), Desktop (1920px)
 * ✓ Font sizes scale with breakpoints
 * ✓ Tap targets are min 44x44px
 * ✓ Padding adapts: p-3 → p-4 → p-6
 * ✓ Images/icons scale: w-6 → w-8 → w-10
 * ✓ Columns adapt: 1 col → 2 col → 3 col
 * ✓ Modals full-height on mobile, fixed size on desktop
 * ✓ Navigation accessible on mobile (bottom nav or hamburger)
 * ✓ Forms have adequate spacing between inputs
 * ✓ Long text wraps properly, no horizontal scroll
 * ✓ Buttons don't overlap on mobile (justify-between or wrap)
 * ✓ Hover states only show on desktop (no :hover on mobile)
 * ✓ Touch-friendly spacing: gap-3 minimum
 */

export default {
  gridPatterns,
  containerPatterns,
  navPatterns,
  typePatterns,
  formPatterns,
  spacingPatterns,
  mobileModal,
  scrollPatterns,
  displayPatterns,
}
