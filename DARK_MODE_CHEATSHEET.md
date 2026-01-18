# 🎯 Quick Reference Card

## Dark Mode Classes - Cheat Sheet

### Text Colors

```jsx
// Light mode: gray-900 | Dark mode: add dark:text-white
<p className="text-gray-900 dark:text-white">Primary text</p>

// Secondary text
<p className="text-gray-600 dark:text-gray-400">Secondary</p>

// Muted text
<p className="text-gray-500 dark:text-gray-500">Muted</p>
```

### Background Colors

```jsx
// Card/Container
<div className="bg-white dark:bg-gray-800">Card</div>

// Page background
<div className="bg-gray-50 dark:bg-gray-900">Page</div>

// Input background
<input className="bg-white dark:bg-gray-700" />
```

### Borders

```jsx
// Default border
<div className="border border-gray-300 dark:border-gray-600">Content</div>

// Subtle border
<div className="border border-gray-200 dark:border-gray-700">Content</div>
```

### Buttons

```jsx
// Primary button
<button className="bg-blue-500 dark:bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-800">
  Action
</button>

// Secondary button
<button className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white">
  Cancel
</button>
```

---

## Common Patterns

### Card Component

```jsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Title</h3>
  <p className="text-gray-600 dark:text-gray-400 mt-2">Description</p>
</div>
```

### Form Input

```jsx
<input
  className="
    w-full
    px-4 py-2
    bg-white dark:bg-gray-700
    border border-gray-300 dark:border-gray-600
    rounded-lg
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500
  "
  placeholder="Enter text..."
/>
```

### Navigation Item

```jsx
<button
  className={`
    px-4 py-2
    rounded-lg
    transition-colors
    ${
      isActive
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }
  `}
>
  Menu Item
</button>
```

### Alert/Banner

```jsx
<div
  className="
  bg-yellow-50 dark:bg-yellow-900/20
  border border-yellow-200 dark:border-yellow-800
  rounded-lg
  p-4
"
>
  <p className="text-yellow-800 dark:text-yellow-200">Warning message</p>
</div>
```

---

## Color Reference

### Grayscale

```
Light Mode    →    Dark Mode
text-gray-900 → dark:text-gray-100 (Primary)
text-gray-700 → dark:text-gray-200 (Secondary)
text-gray-600 → dark:text-gray-400 (Tertiary)
text-gray-500 → dark:text-gray-500 (Muted)

bg-white      → dark:bg-gray-800 (Cards)
bg-gray-50    → dark:bg-gray-900 (Page)
bg-gray-100   → dark:bg-gray-700 (Input)
bg-gray-200   → dark:bg-gray-600 (Hover)
```

### Semantic Colors

```
Blue: from-blue-400 to blue-600 (Light) → blue-400 to blue-600 (Dark)
Red: from-red-400 to red-600 (Light) → red-400 to red-600 (Dark)
Green: from-green-400 to green-600 (Light) → green-400 to green-600 (Dark)
```

---

## Implementation Checklist

When updating a component:

- [ ] Identify all color classes
- [ ] Add dark: prefix to each color
- [ ] Test text contrast (4.5:1 minimum)
- [ ] Verify no text/background clashes
- [ ] Check hover states in dark mode
- [ ] Test on multiple screen sizes
- [ ] Verify icons are visible
- [ ] Test with actual dark mode (not DevTools)

---

## Common Mistakes to Avoid

❌ **Wrong:**

```jsx
<div className="bg-white dark:bg-white">Not different!</div>
```

✅ **Right:**

```jsx
<div className="bg-white dark:bg-gray-800">Different in both modes</div>
```

---

❌ **Wrong:**

```jsx
<p className="text-black dark:text-white">Could fail contrast</p>
```

✅ **Right:**

```jsx
<p className="text-gray-900 dark:text-gray-100">Better contrast</p>
```

---

❌ **Wrong:**

```jsx
<div className="bg-gray-100">Only light mode styled</div>
```

✅ **Right:**

```jsx
<div className="bg-gray-100 dark:bg-gray-800">Both modes styled</div>
```

---

## Theme Hook Usage

```javascript
import { useTheme } from '@/context/ThemeContext'

export const MyComponent = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Switch theme</button>
    </>
  )
}
```

---

## Browser DevTools Testing

**Toggle dark mode in DevTools:**

```javascript
// In Console:
document.documentElement.classList.toggle('dark')
```

**Check current theme:**

```javascript
console.log(localStorage.getItem('theme'))
```

**Check if dark class is applied:**

```javascript
console.log(document.documentElement.classList.contains('dark'))
```

---

## Tailwind Dark Mode Documentation

For more information, refer to:

- https://tailwindcss.com/docs/dark-mode
- Dark mode in Tailwind CSS uses the `dark:` prefix
- Class-based dark mode requires `darkMode: 'class'` in config

---

## Quick Copy-Paste Templates

### Page Template

```jsx
export const MyPage = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Page Title</h1>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Card Title</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Card content</p>
        </div>
      </div>
    </div>
  )
}
```

---

## Support

For questions about dark mode implementation:

1. Check [THEME_GUIDE.md](./THEME_GUIDE.md)
2. Review [THEME_QUICKSTART.md](./THEME_QUICKSTART.md)
3. Reference this file
4. Check Tailwind docs

---

**Last Updated:** January 17, 2026
**Status:** ✅ Ready to use
