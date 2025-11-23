# Tool Pages Migration Guide

This guide explains how to migrate existing tool pages to use the new `ToolPageLayout` component, which enforces a consistent 6-section structure across all tool pages.

## Why Migrate?

The `ToolPageLayout` component ensures all tools follow this consistent structure:
1. **Header** - Title, badge, description
2. **The Actual Tool** - Interactive tool component
3. **Educational Content** - How-to guides, explanations, best practices
4. **FAQ** - Frequently asked questions in accordion format
5. **Related Tools** - Links to similar tools
6. **CTA** - Call-to-action for Rybbit signup

## Example: utm-builder (Fully Migrated)

See `/tools/utm-builder/page.tsx` for a complete working example of a migrated tool.

## Migration Steps

### Step 1: Import the Layout Component

Replace individual component imports with the `ToolPageLayout`:

```tsx
// Before
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RelatedTools } from "@/components/RelatedTools";
import { ToolCTA } from "../components/ToolCTA";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// After
import { ToolPageLayout } from "../components/ToolPageLayout";
```

### Step 2: Extract Educational Content into a Constant

Move all educational/informational content into a single JSX constant:

```tsx
const educationalContent = (
  <>
    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
      Section Title
    </h2>
    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
      Your educational content here...
    </p>

    {/* Include all your educational sections */}
  </>
);
```

### Step 3: Convert FAQs to Array Format

Transform your FAQ Accordion into a simple array:

```tsx
// Before (inline Accordion)
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>What is...?</AccordionTrigger>
    <AccordionContent>Answer here</AccordionContent>
  </AccordionItem>
  {/* ... more items */}
</Accordion>

// After (array of objects)
const faqs = [
  {
    question: "What is...?",
    answer: "Answer here",
  },
  {
    question: "Another question?",
    answer: "Another answer", // Can also be JSX with <Link>, etc.
  },
];
```

**Note**: FAQ answers can be either strings or JSX (ReactNode):

```tsx
const faqs = [
  {
    question: "How do I track with Rybbit?",
    answer: (
      <>
        Use{" "}
        <Link href="https://rybbit.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          Rybbit
        </Link>{" "}
        to track your analytics.
      </>
    ),
  },
];
```

### Step 4: Use ToolPageLayout in Your Default Export

Replace the entire JSX structure with the layout component:

```tsx
export default function YourToolPage() {
  return (
    <ToolPageLayout
      // Basic info
      toolSlug="your-tool-slug"
      title="Your Tool Title"
      description="Brief description of what your tool does and why it's useful."
      badge="Free Tool" // or "AI-Powered Tool"

      // Content sections
      toolComponent={<YourToolForm />}
      educationalContent={educationalContent}
      faqs={faqs}

      // Navigation
      relatedToolsCategory="analytics" // or "seo", "privacy", etc.

      // CTA
      ctaTitle="Track with Rybbit"
      ctaDescription="See detailed analytics in real-time."
      ctaEventLocation="your_tool_cta"
      ctaButtonText="Start tracking for free" // Optional, has default

      // Optional structured data
      structuredData={structuredData} // Your existing JSON-LD
    />
  );
}
```

## Complete Before/After Example

### Before Migration

```tsx
export default function ExampleToolPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <Breadcrumbs items={[...]} />

          {/* Header */}
          <div className="mb-16">
            <div className="inline-block mb-4 px-4 py-1.5 bg-emerald-100 ...">
              <span>Free Tool</span>
            </div>
            <h1>Tool Title</h1>
            <p>Description</p>
          </div>

          {/* Tool */}
          <ToolForm />

          {/* Educational Content */}
          <div className="mb-16">
            <h2>How It Works</h2>
            <p>Content...</p>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <Accordion>...</Accordion>
          </div>

          <RelatedTools currentToolHref="/tools/example" category="analytics" />
        </div>

        <ToolCTA title="..." description="..." eventLocation="example_cta" />
      </div>
    </>
  );
}
```

### After Migration

```tsx
import { ToolPageLayout } from "../components/ToolPageLayout";
import { ToolForm } from "./ToolForm";
import type { Metadata } from "next";

export const metadata: Metadata = { /* same as before */ };

const structuredData = { /* same as before */ };

const educationalContent = (
  <>
    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">How It Works</h2>
    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">Content...</p>
  </>
);

const faqs = [
  {
    question: "First question?",
    answer: "First answer",
  },
  {
    question: "Second question?",
    answer: "Second answer",
  },
];

export default function ExampleToolPage() {
  return (
    <ToolPageLayout
      toolSlug="example"
      title="Tool Title"
      description="Description"
      badge="Free Tool"
      toolComponent={<ToolForm />}
      educationalContent={educationalContent}
      faqs={faqs}
      relatedToolsCategory="analytics"
      ctaTitle="Track with Rybbit"
      ctaDescription="Get detailed analytics."
      ctaEventLocation="example_cta"
      structuredData={structuredData}
    />
  );
}
```

## Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `toolSlug` | `string` | URL-friendly tool identifier (e.g., "utm-builder") |
| `title` | `string` | Page title shown in header |
| `description` | `string` | Brief description below title |
| `toolComponent` | `ReactNode` | Your interactive tool form/component |
| `educationalContent` | `ReactNode` | Educational content section (JSX) |
| `faqs` | `FAQItem[]` | Array of FAQ objects |
| `relatedToolsCategory` | `string` | Category for related tools ("seo", "analytics", "privacy") |
| `ctaTitle` | `string` | CTA section title |
| `ctaDescription` | `string` | CTA section description |
| `ctaEventLocation` | `string` | Event tracking location identifier |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `badge` | `string` | `"Free Tool"` | Badge text shown above title |
| `ctaButtonText` | `string` | `"Start tracking for free"` | CTA button text |
| `structuredData` | `object` | `undefined` | JSON-LD structured data for SEO |

### FAQItem Type

```typescript
interface FAQItem {
  question: string;
  answer: ReactNode; // Can be string or JSX
}
```

## Common Issues

### Issue: FAQ answers with links

**Solution**: Use JSX in the answer field:

```tsx
const faqs = [
  {
    question: "How do I use this with Rybbit?",
    answer: (
      <>
        Visit{" "}
        <Link href="https://rybbit.com" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          Rybbit
        </Link>{" "}
        to get started.
      </>
    ),
  },
];
```

### Issue: Complex educational content with multiple sections

**Solution**: Keep all sections in the single `educationalContent` constant:

```tsx
const educationalContent = (
  <>
    <h2>Section 1</h2>
    <p>Content 1...</p>

    <h2 className="mt-8">Section 2</h2>
    <p>Content 2...</p>

    <h3 className="mt-6">Subsection</h3>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </>
);
```

### Issue: Tool needs custom wrapper or additional context

**Solution**: Wrap your tool component when passing it:

```tsx
toolComponent={
  <div className="custom-wrapper">
    <h2 className="text-2xl font-bold mb-6">Try the Tool</h2>
    <YourToolForm />
  </div>
}
```

## Migration Checklist

For each tool page, verify:

- [ ] Imports updated to use `ToolPageLayout`
- [ ] Educational content extracted to `educationalContent` constant
- [ ] FAQs converted to array format
- [ ] All 6 sections are present and populated
- [ ] `toolSlug` matches the directory name
- [ ] `relatedToolsCategory` is correct ("seo", "analytics", or "privacy")
- [ ] CTA event location follows naming convention: `{tool_slug}_cta`
- [ ] Page renders correctly in development
- [ ] Structured data is passed through (if it exists)
- [ ] No TypeScript errors

## Tools to Migrate

Current tools in `/tools/`:
- [ ] analytics-detector
- [ ] bounce-rate-calculator
- [ ] ctr-calculator
- [ ] funnel-visualizer
- [ ] marketing-roi-calculator
- [ ] meta-description-generator
- [ ] og-tag-generator
- [ ] page-speed-calculator
- [ ] privacy-policy-builder
- [ ] sample-size-calculator
- [ ] seo-title-generator
- [ ] traffic-value-calculator
- [x] utm-builder (completed as example)

## Benefits of Migration

1. **Consistency**: All tools follow the exact same structure
2. **Maintainability**: Update layout in one place for all tools
3. **Type Safety**: TypeScript ensures required sections are present
4. **Developer Experience**: Clear interface for what's needed
5. **SEO**: Consistent structure improves search rankings
6. **User Experience**: Familiar navigation patterns across tools

## Questions?

If you encounter issues during migration, check:
1. The working example at `/tools/utm-builder/page.tsx`
2. The component at `/tools/components/ToolPageLayout.tsx`
3. TypeScript types: `ToolPageLayoutProps` and `FAQItem`
