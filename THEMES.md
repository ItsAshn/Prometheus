# Prometheus Theme System

## Overview

Prometheus includes a powerful theme system that allows you to customize the appearance of your video streaming platform. You can choose from pre-built themes or create your own custom themes using CSS variables.

## Table of Contents

- [Quick Start](#quick-start)
- [Pre-built Themes](#pre-built-themes)
- [Using Themes](#using-themes)
- [Creating Custom Themes](#creating-custom-themes)
- [CSS Variables Reference](#css-variables-reference)
- [Theme Components](#theme-components)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

1. **Access Admin Panel**: Navigate to `/admin` and log in
2. **Go to Configuration**: Click on "Site Configuration"
3. **Choose a Theme**: Scroll to "Theme Templates" section
4. **Apply Theme**: Click "Apply" on your preferred theme
5. **Refresh**: Reload the page to see changes

> **Note**: Themes are stored in your configuration file and work in both development and production environments. The theme CSS is dynamically loaded on every page request for instant updates.

---

## Pre-built Themes

### 1. Retro Theme (Default)

**Perfect for**: Gaming channels, nostalgic content, retro aesthetics

**Features**:

- Bold, pixelated aesthetic
- Sharp edges and hard corners
- Vibrant neon color palette
- Heavy shadows for depth
- Gaming-inspired design elements

**Color Palette**:

- Primary: `#3b82f6` (Bright Blue)
- Accent: `#ff006e` (Hot Pink)
- Background: Light/Dark adaptive
- Borders: Bold and visible

---

### 2. Modern Theme

**Perfect for**: Professional content, tech channels, contemporary design

**Features**:

- Clean, minimalist design
- Smooth rounded corners
- Subtle shadows and gradients
- Elegant transitions
- Modern typography with Inter font family

**Color Palette**:

- Primary: `#667eea` (Soft Purple)
- Accent: `#48bb78` (Green)
- Background: Gradient backgrounds
- Borders: Soft and subtle

**Special Effects**:

- Glassmorphism on header
- Smooth hover animations
- Gradient buttons with shine effects

---

### 3. Cyberpunk Theme

**Perfect for**: Tech content, sci-fi channels, futuristic aesthetics

**Features**:

- Neon-lit futuristic design
- Glowing effects and shadows
- Sharp, angular elements
- Dark backgrounds with neon accents
- Animated borders and glows

**Color Palette**:

- Primary: `#ff006e` (Neon Pink)
- Secondary: `#00f5ff` (Neon Cyan)
- Purple: `#b967ff` (Neon Purple)
- Green: `#05ffa1` (Neon Green)
- Background: Deep dark (`#0a0e27`)

**Special Effects**:

- Neon glow on hover
- Scanline background pattern
- Radial gradients for ambiance
- Pulsing animations
- Text shadows with glow

---

## Using Themes

### Method 1: Apply Pre-built Theme

1. Log in to admin panel (`/admin`)
2. Navigate to "Site Configuration"
3. Scroll to "Theme Templates" section
4. Click "Apply" on your chosen theme
5. Refresh the page

The theme is applied immediately and saved in your configuration.

### Method 2: Custom CSS

1. Log in to admin panel
2. Navigate to "Site Configuration"
3. Scroll to "Custom CSS" section
4. Paste your custom CSS code
5. Click "Apply CSS"
6. Refresh to see changes

**⚠️ Warning**: Custom CSS overwrites `global.css`. A backup is created automatically.

---

## Creating Custom Themes

### Step 1: Understand the Structure

All themes use CSS custom properties (variables) for consistency. The base structure includes:

```css
:root {
  /* Your light theme variables */
}

[data-theme="dark"] {
  /* Your dark theme variables */
}
```

### Step 2: Define Your Color Palette

Start with your core colors:

```css
:root {
  /* Primary brand colors */
  --color-primary: #your-color;
  --color-primary-hover: #your-hover-color;
  --color-primary-foreground: #text-on-primary;

  /* Background colors */
  --color-background: #your-bg;
  --color-foreground: #your-text;
  --color-card: #card-bg;

  /* Accent colors */
  --color-accent: #accent-color;
  --color-border: #border-color;
}
```

### Step 3: Customize Design Tokens

Adjust spacing, typography, and effects:

```css
:root {
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  /* Shadows */
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Typography */
  --font-size-base: 1rem;
  --font-weight-bold: 700;
}
```

### Step 4: Style Key Components

Target specific components for custom styling:

```css
/* Header */
.app-header {
  background: your-custom-gradient;
  backdrop-filter: blur(10px);
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #color1, #color2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Cards */
.video-card {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
}
```

### Step 5: Add Dark Mode Support

Always include dark mode variants:

```css
[data-theme="dark"] {
  --color-background: #your-dark-bg;
  --color-foreground: #light-text;
  --color-card: #dark-card-bg;
  /* ... other dark mode colors */
}
```

---

## CSS Variables Reference

### Color Variables

| Variable                   | Purpose               | Example   |
| -------------------------- | --------------------- | --------- |
| `--color-background`       | Main background color | `#ffffff` |
| `--color-foreground`       | Main text color       | `#0f172a` |
| `--color-primary`          | Primary brand color   | `#3b82f6` |
| `--color-primary-hover`    | Primary hover state   | `#2563eb` |
| `--color-secondary`        | Secondary UI elements | `#f1f5f9` |
| `--color-accent`           | Accent highlights     | `#8b5cf6` |
| `--color-destructive`      | Delete/error actions  | `#ef4444` |
| `--color-border`           | Border colors         | `#e2e8f0` |
| `--color-muted`            | Muted backgrounds     | `#f1f5f9` |
| `--color-muted-foreground` | Muted text            | `#64748b` |

### Design Token Variables

| Variable                                   | Purpose       | Values                |
| ------------------------------------------ | ------------- | --------------------- |
| `--radius-sm/md/lg/xl`                     | Border radius | `0.25rem` - `1rem`    |
| `--spacing-1` through `--spacing-24`       | Spacing scale | `0.25rem` - `6rem`    |
| `--font-size-xs` through `--font-size-4xl` | Font sizes    | `0.75rem` - `2.25rem` |
| `--font-weight-normal/bold`                | Font weights  | `400` - `700`         |
| `--shadow-sm/md/lg/xl`                     | Box shadows   | Various shadow values |

### Component-Specific Classes

| Class          | Component         | Usage                 |
| -------------- | ----------------- | --------------------- |
| `.app-header`  | Main header       | Top navigation bar    |
| `.app-main`    | Main content area | Content wrapper       |
| `.btn-primary` | Primary button    | Main call-to-action   |
| `.btn-logout`  | Logout button     | Admin logout          |
| `.nav-link`    | Navigation links  | Header navigation     |
| `.video-card`  | Video cards       | Video thumbnails      |
| `.admin-card`  | Admin panels      | Admin dashboard cards |

---

## Theme Components

### 1. Header Component

The header includes logo, navigation, and user controls:

```css
.app-header {
  /* Customize header appearance */
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  /* Logo styling */
  color: var(--color-foreground);
  font-weight: var(--font-weight-bold);
}

.nav-link {
  /* Navigation link styling */
  color: var(--color-muted-foreground);
}
```

### 2. Button Styles

Buttons use consistent design tokens:

```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-6);
}
```

### 3. Card Components

Cards display content with consistent styling:

```css
.admin-card {
  background: var(--color-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
```

---

## Best Practices

### 1. Always Use CSS Variables

✅ **Do**:

```css
.my-component {
  background: var(--color-primary);
  padding: var(--spacing-4);
}
```

❌ **Don't**:

```css
.my-component {
  background: #3b82f6;
  padding: 1rem;
}
```

### 2. Support Dark Mode

Always define dark mode variants:

```css
:root {
  --my-color: #ffffff;
}

[data-theme="dark"] {
  --my-color: #0f172a;
}
```

### 3. Test Responsive Design

Ensure your theme works on all screen sizes:

```css
@media (max-width: 768px) {
  .header-container {
    padding: var(--spacing-4);
  }
}
```

### 4. Use Semantic Naming

Name variables by purpose, not appearance:

```css
/* Good */
--color-primary
--color-destructive

/* Bad */
--blue-color
--red-color
```

### 5. Maintain Accessibility

- Ensure sufficient color contrast (WCAG AA: 4.5:1 for text)
- Test with screen readers
- Provide focus states for interactive elements
- Support reduced motion preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 6. Backup Before Major Changes

Before applying custom CSS:

- A backup is automatically created in `temp/global.css.backup`
- You can also manually copy `src/global.css`

---

## Advanced Customization

### Adding Custom Fonts

```css
@import url("https://fonts.googleapis.com/css2?family=Your+Font&display=swap");

body {
  font-family:
    "Your Font",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
}
```

### Creating Animated Backgrounds

```css
body {
  background: linear-gradient(45deg, #color1, #color2);
  animation: gradientShift 15s ease infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
```

### Adding Glassmorphism Effects

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Custom Scrollbar

```css
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-background);
}

::-webkit-scrollbar-thumb {
  background: var(--color-primary);
  border-radius: var(--radius-full);
}
```

---

## Troubleshooting

### Theme Not Applying

1. **Clear browser cache**: Press `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. **Check file permissions**: Ensure `src/global.css` is writable
3. **Verify admin authentication**: Make sure you're logged in
4. **Check console**: Look for errors in browser developer tools

### Colors Not Changing

1. **Verify CSS variables**: Check that you're using `var(--variable-name)`
2. **Check specificity**: Ensure your CSS rules have sufficient specificity
3. **Inspect elements**: Use browser DevTools to see computed styles

### Dark Mode Not Working

1. **Check theme toggle**: Ensure the theme toggle button is working
2. **Verify dark mode selectors**: Make sure you're using `[data-theme="dark"]`
3. **Test manually**: Add `data-theme="dark"` to `<body>` element

### Custom CSS Breaking Layout

1. **Restore backup**: Copy from `temp/global.css.backup` to `src/global.css`
2. **Validate CSS**: Use a CSS validator to check for syntax errors
3. **Test incrementally**: Apply changes in small sections
4. **Check browser compatibility**: Test in different browsers

### Fonts Not Loading

1. **Check import statement**: Ensure font import is at the top of CSS
2. **Verify font URL**: Make sure the font URL is accessible
3. **Check fallback fonts**: Ensure fallback fonts are defined

---

## File Locations

| File            | Purpose                     | Location                   |
| --------------- | --------------------------- | -------------------------- |
| Active theme    | Currently active CSS        | `src/global.css`           |
| Retro theme     | Default retro theme         | `src/global.css.original`  |
| Modern theme    | Modern minimalist theme     | `src/themes/modern.css`    |
| Cyberpunk theme | Neon cyberpunk theme        | `src/themes/cyberpunk.css` |
| CSS backup      | Auto-backup of previous CSS | `temp/global.css.backup`   |
| Site config     | Theme configuration         | `temp/site-config.json`    |

---

## Examples

### Example 1: Minimalist Theme

```css
:root {
  --color-primary: #000000;
  --color-background: #ffffff;
  --radius-sm: 0;
  --radius-md: 0;
  --shadow: none;
}

.app-header {
  border-bottom: 2px solid #000000;
}

.btn-primary {
  background: #000000;
  color: #ffffff;
  border-radius: 0;
}
```

### Example 2: Gradient Theme

```css
:root {
  --color-primary: #667eea;
  --color-primary-hover: #764ba2;
}

body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
```

### Example 3: High Contrast Theme

```css
:root {
  --color-background: #ffffff;
  --color-foreground: #000000;
  --color-primary: #0000ff;
  --color-border: #000000;
}

* {
  border-width: 2px !important;
}
```

---

## Support

For issues, questions, or feature requests:

- Check existing issues in the repository
- Create a new issue with detailed description
- Include screenshots and browser information
- Provide your custom CSS if applicable

---

## License

This theme system is part of the Prometheus video streaming platform. Refer to the main LICENSE file for details.

---

**Happy Theming! 🎨**
