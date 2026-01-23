# Logo Change Guide

## Overview
The logo has been centralized into a reusable `Logo` component located at:
`frontend/src/components/layout/Logo.tsx`

## How to Change the Logo

### Option 1: Replace the Logo Image (Recommended)

1. **Add your logo file** to the `/frontend/public/` folder:
   - File name: `logo.png` (or `.jpg`, `.svg`, `.webp`)
   - Recommended size: 40x40px to 200x200px
   - Format: PNG with transparency (recommended) or any image format

2. **Update the logo path** in `Logo.tsx` if using a different filename:
   ```typescript
   logoPath="/your-logo-file.png"
   ```

### Option 2: Change Brand Name

If you want to change the brand name from "HealthLife" to something else:

1. **Update the Logo component** in `frontend/src/components/layout/Logo.tsx`:
   ```typescript
   brandName="YourBrandName"
   ```

2. **Or pass it as a prop** when using the Logo component:
   ```typescript
   <Logo brandName="YourBrandName" />
   ```

### Option 3: Customize Logo Appearance

The Logo component accepts these props:
- `className`: Additional CSS classes for the container
- `showText`: Show/hide the brand name text (default: `true`)
- `textClassName`: Custom CSS classes for the text
- `logoPath`: Path to your logo image (default: `/logo.png`)
- `logoAlt`: Alt text for the logo image
- `brandName`: Brand name text (default: `HealthLife`)

Example:
```typescript
<Logo 
  showText={false}  // Hide text, show only logo
  logoPath="/custom-logo.svg"
  brandName="MyBrand"
/>
```

## Where the Logo is Used

The logo is automatically used in:
1. **Header** (`frontend/src/components/layout/Header.tsx`) - Navigation bar
2. **Footer** (`frontend/src/components/layout/Footer.tsx`) - Footer section

Both components now use the centralized `Logo` component, so changing it in one place updates everywhere.

## Fallback Behavior

If the logo image file is not found or fails to load, the component will automatically show:
- A gradient box with the first letter of the brand name
- This ensures the logo area is never empty

## Current Logo Implementation

- **Location**: `frontend/src/components/layout/Logo.tsx`
- **Default Image**: `/public/logo.png`
- **Default Brand Name**: "HealthLife"
- **Size**: 40x40px (w-10 h-10)

## Next Steps

1. Add your logo file to `/frontend/public/logo.png`
2. If you want to change the brand name, update the `brandName` prop or default value
3. The logo will automatically appear in the header and footer

