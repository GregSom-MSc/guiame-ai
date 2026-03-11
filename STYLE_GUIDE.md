# Guíame.ai Design System & Components Guide

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Navy Blue | #081D3C | Primary: Headers, backgrounds, text |
| Orange/Gold | #FF9500 | Accent: Buttons, highlights, hover effects |
| White | #FFFFFF | Text on dark backgrounds, clean spaces |
| Light Gray | #F8F9FA | Section backgrounds, light areas |
| Dark Gray | #555 | Body text |

## Typography

- **Font Family**: Poppins (or fallback: Segoe UI, Tahoma, Geneva, Verdana, sans-serif)
- **Heading Sizes**: Responsive using `clamp()` for fluid scaling
  - H1: `clamp(2rem, 5vw, 3.5rem)`
  - H2: `clamp(1.75rem, 4vw, 2.5rem)`
- **Body**: 1rem, line-height: 1.6

## Components Ready to Build

### 1. Feature Cards Section
- 4 cards highlighting: Routes, Restaurants, Hidden Gems, Local Tips
- Card layout: Icon + Title + Description + Small CTA
- Hover effect: Subtle lift with shadow
- Responsive: 4 columns desktop, 2 mobile, 1 tablet

### 2. Testimonials / Social Proof
- Card-based layout: Avatar + Quote + Name + Role
- Background: White with light border
- Accent: Orange left border

### 3. Gallery / Image Section
- Edinburgh imagery with orange accent overlay
- Grid layout: 3 columns desktop, 1 mobile
- Hover effect: Slight zoom + orange overlay

### 4. CTA Section
- Large heading + description
- Primary orange button
- Centered, full-width background

### 5. Newsletter / Contact Form
- Input field + subscribe button
- Validation included
- Success message

## Reusable Classes

- `.container` - Max-width 1200px centering
- `.btn` - Base button styling
- `.btn-primary` - Orange filled button
- `.btn-secondary` - White outline button
- `[data-animate]` - For scroll animations

## Responsive Breakpoints

- **Desktop**: > 1200px
- **Tablet**: 768px - 1200px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

## File Structure

```
NewGuiameai/
├── index.html
├── guide.html (to be created)
├── contact.html (to be created)
├── assets/
│   ├── css/
│   │   └── style.css (modular, organized by sections)
│   ├── js/
│   │   └── main.js (interactions, menu toggle, smooth scroll)
│   └── img/
│       ├── logo.png (your logo)
│       ├── favicon.ico
│       └── (other images)
├── README.md
├── LICENSE
└── .gitignore
```

## Next Steps to Complete

1. **Logo & Images**: Add logo.png, favicon.ico, and hero background image
2. **Feature Cards Section**: Uncomment and develop in style.css
3. **Pages**: Create guide.html and contact.html pages
4. **Contact Form**: Add functional form with validation
5. **Performance**: Add image optimization, lazy loading
6. **SEO**: Update meta tags for each page

## Style Guide Notes

- **Spacing**: Use multiples of 0.5rem (8px) for consistency
- **Border Radius**: 8px for buttons and cards
- **Shadows**: Use `0 2px 8px rgba(0, 0, 0, 0.1)` for subtle depth
- **Transitions**: 0.3s ease for smooth interactions
- **Mobile First**: Design for mobile first, then scale up

