# Dark/Light Theme Implementation Guide

**Feature**: Dark and Light Mode Theme Support
**Status**: Completed
**Date**: January 17, 2026

---

## Overview

The application now supports dark and light theme modes with the following features:

- **System Theme Detection**: Automatically detects user's system preference
- **Manual Toggle**: Users can manually switch between dark and light modes
- **Persistent Storage**: Theme preference is saved to localStorage
- **Smooth Transitions**: Seamless theme switching without page reload
- **Tailwind Integration**: Leverages Tailwind CSS dark mode (class-based)

---

## How It Works

### ThemeContext (`src/context/ThemeContext.jsx`)

The theme system is built on React Context API:

```javascript
// Provides:
- theme: 'light' | 'dark'
- toggleTheme(): Function to switch themes
```

**Features:**

1. Reads localStorage for saved preference
2. Falls back to system preference via `prefers-color-scheme`
3. Listens to system theme changes
4. Automatically applies class to `<html>` element
5. Saves preference to localStorage

### ThemeToggle Component (`src/components/ThemeToggle.jsx`)

A simple button component that:

- Displays Moon icon in light mode (to switch to dark)
- Displays Sun icon in dark mode (to switch to light)
- Has accessible labels and tooltips
- Responsive styling with dark mode support

### Integration Points

1. **main.jsx**: Wraps `<App />` with `<ThemeProvider>`
2. **Layout.jsx**:
   - Imports and uses `ThemeToggle` component
   - Adds dark mode classes to UI elements
3. **Tailwind Config**: Enables class-based dark mode
4. **HTML Classes**: `dark` class applied to `<html>` element

---

## Using Dark Mode Classes in Components

### Tailwind Dark Mode Syntax

Use the `dark:` prefix to style elements in dark mode:

```jsx
// Light mode: bg-white, Dark mode: bg-gray-800
<div className="bg-white dark:bg-gray-800">
  {/* content */}
</div>

// Text colors
<p className="text-gray-900 dark:text-gray-100">
  This text adapts to theme
</p>

// Complex example
<button className="
  bg-blue-500 dark:bg-blue-700
  text-white
  hover:bg-blue-600 dark:hover:bg-blue-800
  rounded-lg
  transition-colors
">
  Click me
</button>
```

### Common Dark Mode Patterns

**Card/Container:**

```jsx
<div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
  <h2 className="text-gray-900 dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Content</p>
</div>
```

**Input Fields:**

```jsx
<input
  className="
    bg-white dark:bg-gray-700
    border border-gray-300 dark:border-gray-600
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    focus:ring-primary-500
    rounded-lg
    px-4 py-2
  "
  placeholder="Enter text..."
/>
```

**Background & Text:**

```jsx
<div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* Page content */}
</div>
```

---

## Current Dark Mode Implementation

### Components Updated:

- ✅ Layout.jsx (Header, Sidebar, Main layout)
- ✅ Dashboard.jsx (Stats cards, gradient background)
- ✅ ThemeToggle.jsx (Theme switcher button)
- ✅ ThemeContext.jsx (Theme state management)

### Components to Update:

- LoginPage.jsx
- RegisterPage.jsx
- MembersPage.jsx
- Any other page components

---

## Updating Other Components

To add dark mode support to any component:

### Step 1: Identify Light Mode Classes

```jsx
<div className="bg-white text-gray-900 shadow rounded-lg">
  <h2 className="text-gray-800">Title</h2>
  <p className="text-gray-600">Description</p>
</div>
```

### Step 2: Add Dark Mode Classes

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow rounded-lg">
  <h2 className="text-gray-800 dark:text-white">Title</h2>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### Step 3: Test Both Modes

Toggle theme and verify:

- Text is readable
- Contrast is good
- No background/text clashes
- Icons are visible

---

## Color Palette for Dark Mode

### Backgrounds

- `bg-gray-800`: Primary dark background (cards, containers)
- `bg-gray-700`: Secondary dark background (inputs, nested elements)
- `bg-gray-900`: Page background, very dark
- `dark:bg-opacity-X`: Use for semi-transparent overlays

### Text

- `text-gray-100`: Primary text on dark (very light)
- `text-gray-300`: Secondary text on dark (lighter)
- `text-gray-400`: Tertiary text on dark (muted)

### Borders

- `border-gray-700`: Borders on dark backgrounds
- `border-gray-600`: Secondary borders

### Status Colors (Dark Mode)

- Primary: `primary-400` or `primary-300` text on dark
- Success: `green-400` text on dark
- Warning: `yellow-400` text on dark
- Error: `red-400` text on dark

---

## Testing Dark Mode

### Manual Testing

1. **Toggle Button**:

   - Click theme toggle in header
   - Verify UI updates smoothly
   - No page reload should occur

2. **Persistence**:

   - Change theme
   - Refresh page
   - Theme should remain the same

3. **System Preference** (Fresh Browser):
   - Clear localStorage: `localStorage.clear()`
   - Refresh page
   - Should match system preference

### Browser DevTools

**Simulate Dark Mode:**

```javascript
// In DevTools Console:
document.documentElement.classList.add('dark')
// or
document.documentElement.classList.remove('dark')
```

**Check Current Theme:**

```javascript
localStorage.getItem('theme')
// Output: 'light' or 'dark'
```

---

## Troubleshooting

### Theme Not Persisting

**Issue**: Theme resets on page refresh
**Solution**: Check if localStorage is enabled and not blocked

```javascript
// Check localStorage
localStorage.setItem('test', 'value')
console.log(localStorage.getItem('test')) // Should print 'value'
```

### Dark Mode Not Applying

**Issue**: `dark:` classes not working
**Solution**: Ensure:

1. Tailwind config has `darkMode: 'class'` set
2. `dark` class is applied to `<html>` element
3. Vite is reloaded (not just browser refresh)

```javascript
// Check if dark class is applied:
console.log(document.documentElement.classList.contains('dark'))
```

### Contrast Issues

**Issue**: Text hard to read in dark mode
**Solution**: Use proper color combinations:

- Dark text on light: `text-gray-900` on `bg-white`
- Light text on dark: `text-gray-100` on `bg-gray-900`
- Never use `text-black` on `dark:bg-gray-900`

---

## Best Practices

1. **Always Test Both Modes**: Update components with care
2. **Use Semantic Colors**: Avoid hardcoded color values
3. **Check Contrast**: Ensure WCAG AA compliance (4.5:1 ratio)
4. **Respect System Preference**: Don't force theme on users
5. **Smooth Transitions**: Add transition utilities
6. **Test on Real Devices**: Desktop, tablet, mobile

---

## Advanced: Custom Dark Mode Styles

### Creating Custom Theme Variables

In `index.css` with Tailwind v4:

```css
@theme {
  --color-dark-bg: #1f2937;
  --color-dark-text: #f3f4f6;
}
```

Then use in JSX:

```jsx
<div className="dark:bg-[var(--color-dark-bg)]">Content</div>
```

### Animation in Dark Mode

```jsx
<div
  className="
  bg-white dark:bg-gray-800
  shadow-lg dark:shadow-none
  transition-all duration-200
"
>
  Content
</div>
```

---

## Future Enhancements

1. **Auto Theme Switching**: Switch theme based on time of day
2. **Custom Color Schemes**: Allow users to pick accent colors
3. **Theme Variants**: Add blue, green, etc. theme options
4. **Accessibility Preferences**: Respect `prefers-reduced-motion`
5. **Theme Sync**: Sync theme across browser tabs

---

## Files Modified

1. ✅ `frontend/src/context/ThemeContext.jsx` - Created
2. ✅ `frontend/src/components/ThemeToggle.jsx` - Created
3. ✅ `frontend/src/main.jsx` - Updated (Added ThemeProvider)
4. ✅ `frontend/src/components/Layout.jsx` - Updated (Added dark mode classes)
5. ✅ `frontend/tailwind.config.js` - Updated (Enabled dark mode)

---

## Summary

The dark/light theme feature is fully implemented and ready to use. Users can:

- Manually toggle between themes using the button in the header
- Have their preference automatically saved
- Experience automatic system preference detection
- Enjoy smooth theme transitions

To extend dark mode to more components, simply add `dark:` prefixed Tailwind classes to existing styles.
