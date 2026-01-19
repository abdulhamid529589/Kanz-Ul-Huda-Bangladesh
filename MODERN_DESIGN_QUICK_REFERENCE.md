# Modern Design Quick Reference

## 🎨 CSS Classes Quick Reference

### Animation Classes

```
.animate-fade-in-up       /* Fade + slide up */
.animate-fade-in-down     /* Fade + slide down */
.animate-slide-in-left    /* Slide from left */
.animate-slide-in-right   /* Slide from right */
.animate-scale-in         /* Scale from small */
.animate-pulse-subtle     /* Gentle pulse */
.animate-shimmer          /* Loading shimmer */
.animate-float            /* Floating motion */
.animate-glow             /* Pulsing glow */
```

### Button Classes

```
.btn-primary              /* Green gradient button */
.btn-secondary            /* Gray button */
.btn-danger               /* Red button */
.btn-outline              /* Border button */
```

### Gradient Classes

```
.gradient-primary         /* Green gradient */
.gradient-secondary       /* Yellow gradient */
.gradient-warm            /* Orange-red-pink */
.gradient-cool            /* Blue-purple-pink */
```

### Transition Classes

```
.transition-smooth        /* 300ms ease-in-out */
.transition-smooth-fast   /* 150ms ease-in-out */
.transition-smooth-slow   /* 500ms ease-in-out */
```

### Hover Effects

```
.hover-lift               /* Lift on hover */
.hover-scale              /* Scale on hover */
.hover-brightness         /* Brightness increase */
```

### Shadow Effects

```
.shadow-glow              /* Green glow */
.shadow-glow-lg           /* Large glow */
```

### Form Classes

```
.input-field              /* Modern input styling */
.input-error              /* Error state */
.card                     /* Card with glass effect */
.badge-*                  /* Status badges */
```

## 🎬 Framer Motion Patterns

### Basic Fade-in Animation

```jsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
  Content
</motion.div>
```

### Slide and Fade

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Hover Effects

```jsx
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClick}>
  Click
</motion.button>
```

### Staggered List Animation

```jsx
<motion.div>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### Icon Animation

```jsx
<motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity }}>
  <Icon />
</motion.div>
```

### Animated Number

```jsx
<motion.p
  className="text-2xl font-bold"
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 0.2 }}
>
  {formatNumber(value)}
</motion.p>
```

## 📊 Component Patterns

### Modern Card

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
  className="card bg-white dark:bg-gray-800 hover:shadow-xl"
>
  Content
</motion.div>
```

### Status Badge

```jsx
<span className="badge-success animate-fade-in-up">
  <CheckCircle className="w-4 h-4" />
  Success
</span>
```

### Primary Button

```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.95 }}
  className="btn-primary shadow-lg hover:shadow-xl"
>
  Click Me
</motion.button>
```

### Input Field

```jsx
<motion.input
  type="text"
  className="input-field"
  whileFocus={{ scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
/>
```

### Loading Spinner

```jsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
  className="spinner w-8 h-8"
/>
```

## 🎯 Common Use Cases

### Adding Animation to Element

1. Import motion from 'framer-motion'
2. Replace div with motion.div
3. Add initial state: `initial={{ opacity: 0 }}`
4. Add end state: `animate={{ opacity: 1 }}`
5. Add timing: `transition={{ duration: 0.3 }}`

### Creating Hover Effect

1. Add `whileHover={{ scale: 1.05 }}`
2. Add `whileTap={{ scale: 0.95 }}` for click effect
3. Combine with `transition={{ type: 'spring', stiffness: 300 }}`

### Staggering List Items

1. Map through items
2. Use `delay: index * 0.1` in transition
3. Increase delay for more spacing

### Badge Animations

1. Use `.animate-fade-in-up` class
2. Or use motion.div with animation props
3. Combine with badge-\* color classes

## 🌈 Color Scheme Reference

### Primary (Green)

- Base: `#22c55e` (green-500)
- Dark: `#16a34a` (green-600)
- Light: `#86efac` (green-400)

### Secondary (Orange)

- Base: `#f59e0b` (orange-500)
- Dark: `#d97706` (orange-600)
- Light: `#fbbf24` (orange-400)

### Backgrounds

- Light: `#ffffff` (white)
- Dark: `#1f2937` (gray-800)
- Glass: `rgba(255, 255, 255, 0.1)`

## ⚡ Performance Tips

1. **Use transform and opacity** - GPU accelerated
2. **Avoid animating width/height** - Causes layout shifts
3. **Use delays for stagger** - Professional feel
4. **Limit simultaneous animations** - Browser performance
5. **Use transition shorthand** - Cleaner code
6. **Set transition types wisely**:
   - `ease-in-out`: Most common
   - `spring`: Bouncy feel
   - `linear`: Continuous motion

## 📱 Responsive Tips

1. Different animations for mobile vs desktop
2. Reduce animation duration on mobile
3. Disable animations on low-end devices
4. Use `prefers-reduced-motion` media query
5. Test on actual devices

## 🐛 Common Issues & Fixes

### Animation Not Working

- Check motion import: `import { motion } from 'framer-motion'`
- Ensure element is motion.div, not div
- Check initial and animate props are different

### Buttons Not Scaling

- Use `whileHover` and `whileTap` with motion.button
- Check className doesn't override transform
- Ensure transition is defined

### Performance Issues

- Reduce animation count
- Use GPU-friendly properties (transform, opacity)
- Increase transition duration
- Check browser DevTools for FPS drops

### List Not Staggering

- Ensure delay is calculated correctly: `index * 0.1`
- Check all items have unique keys
- Verify items are mapped correctly

## 🎓 Best Practices

1. **Consistency**: Use same animation durations across app
2. **Timing**: 300ms for most interactions, 500ms for important
3. **Purpose**: Every animation should have a purpose
4. **Subtlety**: Less is more - subtle animations are professional
5. **Testing**: Test on real devices for performance
6. **Accessibility**: Respect `prefers-reduced-motion`
7. **Documentation**: Comment complex animations

## 📚 Resources

- Framer Motion Docs: https://www.framer.com/motion/
- Tailwind CSS: https://tailwindcss.com/
- Lucide Icons: https://lucide.dev/
- Web Animation Principles: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations

## 🚀 Quick Start for New Features

```jsx
import { motion } from 'framer-motion'

export function NewFeature() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
      <motion.h2
        className="text-2xl font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Title
      </motion.h2>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-primary"
      >
        Action
      </motion.button>
    </motion.div>
  )
}
```

---

**Created**: 2024
**Version**: 1.0
**Status**: Ready for Use
