# TechStore - E-Commerce Prototype

A modern, responsive e-commerce prototype inspired by Logitech G's website, built with vanilla HTML, CSS, and JavaScript following web standards and best practices.

## 🎯 Features

### Pages Included
1. **Landing Page (index.html)**
   - **Working hero carousel** with 4 slides and auto-play
   - Smooth slide transitions with indicator navigation
   - Promotional banners with optimized button styling
   - Product series showcase
   - Category grid
   - Benefits section
   - Responsive footer with icon-based newsletter
   - **Fully responsive** on all devices

2. **Shop Page (shop.html)**
   - Product filtering sidebar with sort option
   - **Mobile-friendly** filter button with overlay
   - Dynamic product rendering from JSON
   - Product grid with cards
   - Price display with discounts
   - Add to cart functionality
   - Product count display
   - **Fully responsive** with optimized mobile layout

3. **Product Page (product.html)**
   - **Dynamic product loading** based on URL parameters
   - Image gallery with thumbnails
   - Product information (loaded from JSON)
   - Color and quantity selectors
   - Add to cart with product tracking
   - Tabbed content (Description, Specifications, Features, Reviews)
   - Related products carousel
   - Customer reviews section
   - **Fully responsive** with touch-friendly controls

### Data Structure
- **products.json**: Comprehensive product database with 8 sample products including:
  - Product IDs, names, prices, descriptions
  - Specifications and features
  - Stock status and ratings
  - Color options and connectivity types
  - Detailed technical information

## 🛠️ Technologies Used

- **HTML5**: Semantic markup, accessibility features
- **CSS3**: Custom properties (CSS variables), Grid, Flexbox, animations
- **JavaScript**: Vanilla JS (no frameworks), ES6+, async/await
- **JSON**: Product data structure
- **Google Material Icons**: Icon library
- **Google Fonts**: Inter font family

## 🎨 Design Features

### Visual Design
- **Darker primary color** (#00b8db) for better contrast
- Reorganized header layout with left-aligned navigation
- Clean, modern interface inspired by Logitech G
- Consistent color scheme with CSS variables
- Smooth transitions and hover effects
- Professional typography with Inter font
- Responsive grid layouts
- Optimized newsletter form (no horizontal overflow)

### User Experience
- Intuitive navigation with streamlined menu
- Interactive product galleries
- Real-time cart updates
- Dynamic product pages (URL-based)
- Filter and sort products
- Smooth scrolling
- Mobile-friendly interface
- Icon-based newsletter subscription

### Accessibility
- Semantic HTML5 elements
- ARIA labels for screen readers
- Keyboard navigation support
- Proper heading hierarchy
- Alt text for images (placeholders)

## 📱 Responsive Design

The prototype is **fully responsive** with optimized layouts for all device sizes:

### Breakpoints
- **Desktop**: 1024px+ (Full layout with sidebar navigation)
- **Tablet**: 768px - 1023px (Adapted layouts, collapsible sidebars)
- **Mobile**: 480px - 767px (Mobile-optimized, single column layouts)
- **Small Mobile**: < 479px (Compact layouts for small screens)

### Mobile Features
- **Hamburger menu** with smooth slide-in navigation
- **Mobile overlay** for menus and filters
- **Floating filter button** on shop page
- **Touch-friendly tap targets** (minimum 44x44px)
- **Collapsible filter sidebar** with backdrop
- **Optimized typography** (responsive font sizes)
- **Single-column product grids** on small screens
- **Stackable elements** for better mobile viewing
- **Hidden elements** on mobile (top bar, etc.)
- **Touch-optimized interactions** (active states instead of hover)

### Responsive Elements
- Navigation menu transforms to mobile drawer
- Product cards adapt from multi-column to single column
- Hero section stacks on mobile with reduced image size
- Footer columns collapse to single column
- Buttons and forms scale appropriately
- Product galleries optimized for touch
- Category cards resize for smaller screens
- Benefits section stacks vertically
- Series cards adjust layout based on screen size

### Touch Optimization
- Larger tap targets for mobile devices
- No hover effects on touch devices
- Active states for tap feedback
- Smooth animations and transitions
- Optimized scrolling experience
- Gesture-friendly interface

## 🔧 Key Functionalities

### Dynamic Product System
- **URL-based product pages**: Use `product.html?id=product-id`
- Products loaded from `products.json`
- Automatic page population with product data
- Support for multiple products
- Extensible product database

### Shopping Cart
- Add items from product pages
- Add items from product cards
- Persistent cart (localStorage)
- Real-time cart count updates
- Visual notifications
- Product ID tracking

### Product Filtering
- Filter by connectivity
- Filter by series
- Filter by price range
- Filter by features
- Sort option in sidebar
- Real-time results update

### Product Sorting
- Featured products
- Newest items
- Name (A-Z)
- Price (high to low)
- Price (low to high)
- Best sellers

### Interactive Elements
- Image gallery navigation
- Dynamic color selection
- Quantity adjustment
- Tab navigation
- Wishlist functionality
- Newsletter subscription with icon button

## 📂 File Structure

```
project/
│
├── index.html          # Landing page
├── shop.html           # Shop/catalog page
├── product.html        # Product detail page (dynamic)
├── dist/css/main.css   # Compiled stylesheet (from Sass)
├── script.js           # JavaScript functionality
├── products.json       # Product database
└── README.md          # This file
```

## 🚀 Getting Started

1. **Open the prototype**
   - Simply open `index.html` in a web browser
   - No server or build process required
   - Make sure all files are in the same directory

2. **Navigate between pages**
   - Click navigation links to explore
   - Use breadcrumbs for easy navigation
   - All internal links are functional
   - Products link to dynamic product pages

3. **Test dynamic features**
   - Click any product to see dynamic loading
   - Add products to cart
   - Use filters on shop page
   - Switch between product images
   - Navigate product tabs
   - Try different product URLs

4. **Test URL parameters**
   - Try: `product.html?id=pro-x2-superstrike`
   - Try: `product.html?id=g502-hero`
   - Product data loads automatically

## 🎯 Recent Enhancements (v1.1)

### Header Redesign
- Navigation moved to left side next to logo
- Removed "Software" and "Descubrir" options
- Header actions moved to right side
- Cleaner, more focused navigation

### Color Updates
- Darkened primary color from #00d9ff to #00b8db
- Better contrast and visibility
- More professional appearance

### Newsletter Optimization
- Icon-based submit button (send icon)
- Fixed horizontal overflow issue
- Button positioned inside input field
- Responsive and mobile-friendly

### Shop Page Improvements
- Removed top controls bar
- Sort filter moved to sidebar
- Product count displayed between header and content
- Cleaner, more organized layout

### Product Page Dynamics
- Fully dynamic based on URL parameters
- Loads data from products.json
- Automatic content population
- Color options rendered dynamically
- Specifications and features from data
- Stock status handling

## 🎨 Customization

### Colors
Edit Sass variables in `src/sass/_variables.sass` and storefront tokens in `src/sass/_legacy.sass`:
```css
:root {
    --primary-color: #00d9ff;
    --secondary-color: #9945ff;
    /* ... more variables */
}
```

### Typography
Change font in CSS:
```css
--font-primary: 'Inter', sans-serif;
```

### Layout
Adjust container max-width:
```css
--container-max-width: 1280px;
```

## 🌟 Notable Features

1. **Professional Design**: Clean, modern interface matching big-tech standards
2. **Fully Functional**: All buttons, links, and interactions work
3. **Shopping Cart**: Complete cart system with persistence
4. **Filter System**: Multi-criteria product filtering
5. **Responsive**: Works on all device sizes
6. **Accessible**: WCAG compliant structure
7. **Performance**: Fast, lightweight, optimized
8. **No Dependencies**: Pure vanilla JavaScript

## 📋 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🔄 Future Enhancements

Potential additions for production:
- Backend integration (API)
- User authentication
- Payment processing
- Product search with autocomplete
- Advanced filtering (ranges, multi-select)
- Product comparison
- User reviews submission
- Order tracking
- Email notifications
- Analytics integration
- Image optimization
- PWA features

## 📄 License

This is a prototype for demonstration purposes. The design is inspired by Logitech G but is a custom implementation.

## 🤝 Credits

- Design inspiration: Logitech G
- Icons: Google Material Icons
- Fonts: Google Fonts (Inter)
- Built with: HTML5, CSS3, JavaScript

---

**Note**: This is a frontend prototype. Product images are represented by placeholders (Material Icons). In a production environment, these would be replaced with actual product images.

For questions or issues, please refer to the code comments or contact the development team.

## 📝 Version History

**Version 1.2** (Latest)
- Fixed hero carousel with auto-play functionality
- Added 4 different hero slides with smooth transitions
- Fully responsive design for all devices
- Enhanced mobile navigation with overlay
- Touch-friendly tap targets for mobile devices
- Optimized layouts for tablet (1024px), mobile (768px), and small mobile (480px)
- Added mobile overlay for better UX
- Improved spacing and typography on mobile
- Better product grid layouts on small screens
- Enhanced filter sidebar for mobile
- Improved mobile menu with smooth animations

**Version 1.1**
- Added dynamic product page loading from JSON
- Created comprehensive products.json database
- Reorganized header navigation
- Darkened primary color for better contrast
- Fixed newsletter form overflow
- Moved sort filter to sidebar
- Improved shop page layout
- Enhanced product linking with URL parameters

**Version 1.0**
- Initial release with all core features
- Landing, shop, and product pages
- Cart system with localStorage
- Filtering and sorting functionality

---

**Version**: 1.2  
**Last Updated**: February 2026  
**Built By**: Claude (Anthropic)

## NPM Workflow

- Install dependencies: `npm install`
- Compile Sass to dist/css/main.css once: `npm run sass:build`
- Watch Sass while developing: `npm run sass:watch`
- Bootstrap assets are loaded locally from `node_modules/bootstrap` in each HTML page.
