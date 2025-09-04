# Image Assets

This directory contains the image files for the Benedicto College Library Management System, including logos and campus images.

## Current Logo

- **benedicto-college-logo.svg** - Main logo used in headers (SVG format for scalability)

## How to Replace with Your School Logo

### Option 1: Replace the SVG file
1. Create your school logo in SVG format
2. Name it `benedicto-college-logo.svg`
3. Replace the existing file in this directory
4. Recommended dimensions: 120x60 pixels (2:1 ratio)

### Option 2: Use a different image format
1. Add your logo file (PNG, JPG, or SVG) to this directory
2. Update the image source in both files:
   - `src/app/login/login.html` (line ~28)
   - `src/app/landing/landing.html` (line ~8)
3. Change the `src` attribute to point to your new logo file

### Logo Requirements

- **Format**: SVG preferred (scalable), PNG/JPG acceptable
- **Size**: Recommended height 60-80px for optimal display
- **Background**: Transparent or white background works best
- **Colors**: Should work well on dark backgrounds (header is dark gray)

### Example Update

If you have a logo named `my-school-logo.png`, update the image tags:

```html
<img 
  src="assets/images/my-school-logo.png" 
  alt="My School Logo" 
  class="h-12 sm:h-14 lg:h-16 w-auto"
>
```

### Responsive Sizing

The logo automatically scales across different screen sizes:
- Mobile: `h-12` (48px)
- Tablet: `h-14` (56px) 
- Desktop: `h-16` (64px)

You can adjust these classes in the HTML files if needed.

## Campus Images

This directory also contains campus and facility images used throughout the site:

- **smart-classrooms.png** - Modern classroom technology
- **collaborative-learning.png** - Students working together (placeholder)
- **research-excellence.png** - Library research facilities (placeholder)
- **campus-main.png** - Main campus view (placeholder)

### Adding Your Own Campus Images

1. **Prepare your images**:
   - Recommended size: 800x600px or higher
   - Format: PNG or JPG
   - Optimize for web (compress to reduce file size)

2. **Add images to this directory**:
   ```
   src/assets/images/
   ├── your-campus-image.jpg
   ├── your-classroom.png
   └── your-facility.jpg
   ```

3. **Update the HTML paths**:
   In `src/app/about/about.html`, update the image sources:
   ```html
   <img src="assets/images/your-campus-image.jpg"
        alt="Your description"
        class="w-full h-64 object-cover rounded-xl shadow-lg mb-4">
   ```

### Campus Image Guidelines

- **Aspect Ratio**: 4:3 or 16:9 works best
- **Resolution**: Minimum 800x600px for quality display
- **File Size**: Keep under 500KB for fast loading
- **Content**: Show actual campus facilities, students, or activities
- **Alt Text**: Always include descriptive alt text for accessibility
