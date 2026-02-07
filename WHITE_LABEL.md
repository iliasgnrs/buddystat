# White Label Configuration Guide

This document describes how to customize BuddyStat with your own branding.

## Environment Variables

Add these to your `.env` file:

```env
# White Label - Brand Identity
NEXT_PUBLIC_BRAND_NAME="BuddyStat"
NEXT_PUBLIC_BRAND_TAGLINE="Your Analytics Solution"
NEXT_PUBLIC_BRAND_DESCRIPTION="Privacy-first analytics platform"

# URLs
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_SUPPORT_EMAIL="support@your-domain.com"
NEXT_PUBLIC_CONTACT_URL="https://your-domain.com/contact"

# Branding Colors (Tailwind CSS format)
NEXT_PUBLIC_PRIMARY_COLOR="blue"
NEXT_PUBLIC_ACCENT_COLOR="indigo"

# Social Links (optional)
NEXT_PUBLIC_TWITTER_URL="https://twitter.com/yourcompany"
NEXT_PUBLIC_GITHUB_URL="https://github.com/yourcompany"
NEXT_PUBLIC_LINKEDIN_URL="https://linkedin.com/company/yourcompany"

# Features Toggle
NEXT_PUBLIC_ENABLE_SIGNUP="true"
NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN="false"
NEXT_PUBLIC_ENABLE_BLOG="true"
NEXT_PUBLIC_ENABLE_DOCS="true"

# Analytics & Tracking (for your own marketing site)
NEXT_PUBLIC_GA_TRACKING_ID=""
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
```

## Asset Files

### Logos
Place your logo files in `client/public/`:
- `logo.svg` - Main logo (SVG preferred for scalability)
- `logo-dark.svg` - Dark mode version (optional)
- `logo-icon.svg` - Icon/favicon source
- `logo-text.svg` - Logo with text

### Favicons
Replace these files in `client/public/`:
- `favicon.ico` - Browser favicon
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` - iOS home screen icon
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

You can generate these from your logo using: https://realfavicongenerator.net/

### Other Assets
- `og-image.png` - Open Graph image (1200x630px) for social media
- `client/public/brand/` - Additional brand assets directory

## Styling Customization

### Theme Colors

Edit `client/tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#your-color',
        secondary: '#your-color',
        accent: '#your-color',
      },
    },
  },
}
```

### Global Styles

Edit `client/src/app/globals.css` for custom CSS:

```css
:root {
  --brand-primary: your-color;
  --brand-gradient: linear-gradient(to right, color1, color2);
}

/* Custom branding styles */
.brand-header {
  /* Your styles */
}
```

## Text Content Customization

### Landing Page
Edit `client/src/app/page.tsx`:
- Hero section text
- Feature descriptions
- Call-to-action buttons
- Testimonials

### About/Company Info
- Update company information
- Terms of service
- Privacy policy
- Contact details

### Documentation
Edit files in `docs/content/docs/`:
- Update product documentation
- Add custom guides
- Include your branding in examples

## Email Templates

Email templates are in `server/src/services/email/`:
- Customize email headers with your logo
- Update email footer with your company info
- Modify email colors to match brand

## SEO & Metadata

Edit `client/src/app/layout.tsx`:

```typescript
export const metadata = {
  title: 'BuddyStat - Your Analytics',
  description: 'Your custom description',
  keywords: ['analytics', 'your', 'keywords'],
  openGraph: {
    title: 'BuddyStat',
    description: 'Your description',
    images: ['/og-image.png'],
  },
}
```

## Custom Features

### Adding Custom Pages
1. Create new route in `client/src/app/your-page/page.tsx`
2. Add navigation link in header/footer components
3. Update sitemap if needed

### Custom Analytics Events
Add custom tracking in `client/src/lib/analytics.ts`

## Domain Configuration

### Update Caddy Configuration

Edit `Caddyfile`:

```
your-domain.com {
    reverse_proxy client:3000
}

api.your-domain.com {
    reverse_proxy server:3001
}
```

### SSL Certificates
Caddy automatically handles SSL certificates via Let's Encrypt when properly configured with a real domain.

## Database Customization

### Custom Tables/Migrations
Add migrations in `server/src/db/migrations/`

### Custom Fields
Update schema in `server/src/db/schema.ts`

## Deployment Checklist

Before deploying your white-labeled version:

- [ ] Updated all environment variables
- [ ] Replaced logo files
- [ ] Generated and added favicons
- [ ] Customized color scheme
- [ ] Updated landing page copy
- [ ] Modified about/contact pages
- [ ] Customized email templates
- [ ] Updated terms of service
- [ ] Updated privacy policy
- [ ] Configured domain in Caddyfile
- [ ] Set proper SEO metadata
- [ ] Tested all features
- [ ] Reviewed all email flows
- [ ] Checked mobile responsiveness
- [ ] Verified dark mode branding

## Maintaining Your Brand During Updates

When merging upstream updates:

1. Your `.gitattributes` file is configured to preserve your branding
2. Environment files (`.env`) will not be overwritten
3. Logo files in `client/public/` are protected
4. Review changes in `client/src/app/` for new features

Always test in development after merging:
```bash
docker-compose up --build
```

## Support

For issues specific to white labeling or customization:
1. Check this documentation
2. Review component files in `client/src/components/`
3. Test changes locally before deploying

## Example Configurations

### Minimal Branding
Just update:
- `.env` with your brand name and URLs
- Logo files in `client/public/`
- Primary color in tailwind config

### Full Custom Branding
Additionally customize:
- Landing page completely redesigned
- Custom color scheme
- Additional pages and features
- Email templates with brand identity
- Custom documentation theme
