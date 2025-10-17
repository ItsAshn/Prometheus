# Quick Theme Customization Guide

This is a quick reference for common theme customization tasks. For complete documentation, see [THEMES.md](THEMES.md).

## 🚀 5-Minute Customizations

### Change Primary Color

```css
:root {
  --color-primary: #YOUR_COLOR_HERE;
  --color-primary-hover: #SLIGHTLY_DARKER_COLOR;
}

[data-theme="dark"] {
  --color-primary: #LIGHTER_VERSION;
}
```

**Example**: Make it green

```css
:root {
  --color-primary: #10b981;
  --color-primary-hover: #059669;
}
```

---

### Change Background

```css
:root {
  --color-background: #YOUR_BG_COLOR;
}

[data-theme="dark"] {
  --color-background: #DARK_BG_COLOR;
}
```

**Example**: Warm beige background

```css
:root {
  --color-background: #faf8f5;
}

[data-theme="dark"] {
  --color-background: #1a1815;
}
```

---

### Add Background Image

```css
body {
  background-image: url("https://your-image-url.com/image.jpg");
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
}

/* Add overlay for readability */
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: -1;
}
```

---

### Change Border Radius (Roundness)

**Super Rounded**:

```css
:root {
  --radius-sm: 0.5rem;
  --radius-md: 1rem;
  --radius-lg: 1.5rem;
  --radius-xl: 2rem;
}
```

**Sharp/Square**:

```css
:root {
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-xl: 0;
}
```

---

### Change Font

**Google Fonts**:

```css
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");

body {
  font-family:
    "Poppins",
    -apple-system,
    sans-serif;
}
```

**System Fonts**:

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

---

### Adjust Shadow Intensity

**Subtle Shadows**:

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.12);
}
```

**Dramatic Shadows**:

```css
:root {
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 16px 32px rgba(0, 0, 0, 0.3);
}
```

---

### Custom Button Styles

**Gradient Buttons**:

```css
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  transform: translateY(-2px);
}
```

**Outlined Buttons**:

```css
.btn-primary {
  background: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary);
  color: white;
}
```

---

## 🎨 Popular Color Schemes

### Ocean Blue

```css
:root {
  --color-primary: #0ea5e9;
  --color-primary-hover: #0284c7;
  --color-accent: #06b6d4;
}
```

### Forest Green

```css
:root {
  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-accent: #34d399;
}
```

### Sunset Orange

```css
:root {
  --color-primary: #f97316;
  --color-primary-hover: #ea580c;
  --color-accent: #fb923c;
}
```

### Royal Purple

```css
:root {
  --color-primary: #8b5cf6;
  --color-primary-hover: #7c3aed;
  --color-accent: #a78bfa;
}
```

### Rose Pink

```css
:root {
  --color-primary: #ec4899;
  --color-primary-hover: #db2777;
  --color-accent: #f472b6;
}
```

---

## 🔧 Common Adjustments

### Increase Overall Spacing

```css
:root {
  --spacing-4: 1.25rem; /* was 1rem */
  --spacing-6: 2rem; /* was 1.5rem */
  --spacing-8: 2.5rem; /* was 2rem */
}
```

### Bigger Text

```css
:root {
  --font-size-base: 1.125rem; /* was 1rem */
  --font-size-lg: 1.25rem; /* was 1.125rem */
  --font-size-xl: 1.5rem; /* was 1.25rem */
}
```

### Thicker Borders

```css
.admin-card,
.video-card,
.form-input {
  border-width: 3px !important;
}
```

---

## 💡 Pro Tips

### 1. Test in Both Light and Dark Mode

Always check your changes in both modes:

```css
:root {
  /* Light mode colors */
}

[data-theme="dark"] {
  /* Dark mode colors */
}
```

### 2. Use Color Contrast Checker

Ensure text is readable: https://webaim.org/resources/contrastchecker/

Minimum ratios:

- Normal text: 4.5:1
- Large text: 3:1

### 3. Start Small

Make one change at a time and test before adding more.

### 4. Keep a Backup

Your original CSS is backed up at `temp/global.css.backup`

### 5. Use Browser DevTools

- Press F12 to open DevTools
- Inspect elements to see computed styles
- Test changes live before applying

---

## 📱 Mobile Optimization

### Ensure Touch Targets Are Big Enough

```css
.btn,
.nav-link {
  min-height: 44px;
  min-width: 44px;
}
```

### Adjust Mobile Spacing

```css
@media (max-width: 768px) {
  :root {
    --spacing-6: 1rem;
    --spacing-8: 1.5rem;
  }
}
```

---

## 🆘 Quick Fixes

### Theme Not Applying?

1. Clear cache: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Check you're logged in as admin
3. Verify CSS has no syntax errors

### Colors Look Wrong?

1. Check you're using `var(--variable-name)` syntax
2. Verify the variable is defined in `:root`
3. Check for typos in variable names

### Layout Broken?

1. Restore backup from `temp/global.css.backup`
2. Apply changes incrementally
3. Validate CSS syntax

---

## 📚 Learn More

- **Full Documentation**: [THEMES.md](THEMES.md)
- **Theme Showcase**: [THEME_SHOWCASE.md](THEME_SHOWCASE.md)
- **Main README**: [README.md](README.md)

---

**Happy Customizing! 🎨**

Need help? Open an issue or discussion on GitHub!
