import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Tool {
  name: string;
  description: string;
  href: string;
  category: "seo" | "analytics" | "privacy";
}

const allTools: Tool[] = [
  {
    name: "SEO Title Generator",
    description: "Generate optimized title tags for better rankings",
    href: "/tools/seo-title-generator",
    category: "seo",
  },
  {
    name: "Meta Description Generator",
    description: "Create compelling meta descriptions that boost CTR",
    href: "/tools/meta-description-generator",
    category: "seo",
  },
  {
    name: "OG Tag Generator",
    description: "Generate Open Graph tags for social sharing",
    href: "/tools/og-tag-generator",
    category: "seo",
  },
  {
    name: "UTM Builder",
    description: "Build campaign URLs with UTM parameters",
    href: "/tools/utm-builder",
    category: "analytics",
  },
  {
    name: "CTR Calculator",
    description: "Calculate click-through rates and compare to benchmarks",
    href: "/tools/ctr-calculator",
    category: "analytics",
  },
  {
    name: "Bounce Rate Calculator",
    description: "Analyze bounce rates and identify issues",
    href: "/tools/bounce-rate-calculator",
    category: "analytics",
  },
  {
    name: "Marketing ROI Calculator",
    description: "Calculate return on investment for marketing campaigns",
    href: "/tools/marketing-roi-calculator",
    category: "analytics",
  },
  {
    name: "Sample Size Calculator",
    description: "Determine A/B test sample sizes for statistical significance",
    href: "/tools/sample-size-calculator",
    category: "analytics",
  },
  {
    name: "Traffic Value Calculator",
    description: "Calculate the monetary value of your website traffic",
    href: "/tools/traffic-value-calculator",
    category: "analytics",
  },
  {
    name: "Page Speed Calculator",
    description: "Calculate revenue impact of page speed improvements",
    href: "/tools/page-speed-calculator",
    category: "analytics",
  },
  {
    name: "Funnel Visualizer",
    description: "Visualize and analyze conversion funnels",
    href: "/tools/funnel-visualizer",
    category: "analytics",
  },
  {
    name: "Analytics Detector",
    description: "Detect analytics tools on any website",
    href: "/tools/analytics-detector",
    category: "privacy",
  },
  {
    name: "AI Privacy Policy Generator",
    description: "Generate GDPR-compliant privacy policies with AI",
    href: "/tools/ai-privacy-policy-generator",
    category: "privacy",
  },
  {
    name: "Privacy Policy Builder",
    description: "Build custom privacy policies for your website",
    href: "/tools/privacy-policy-builder",
    category: "privacy",
  },
];

interface RelatedToolsProps {
  currentToolHref: string;
  category?: "seo" | "analytics" | "privacy";
  maxTools?: number;
}

export function RelatedTools({ currentToolHref, category, maxTools = 3 }: RelatedToolsProps) {
  let relatedTools = allTools.filter(tool => tool.href !== currentToolHref);

  // If category is specified, prioritize tools from the same category
  if (category) {
    const sameCategory = relatedTools.filter(tool => tool.category === category);
    const otherCategory = relatedTools.filter(tool => tool.category !== category);
    relatedTools = [...sameCategory, ...otherCategory];
  }

  // Limit to maxTools
  relatedTools = relatedTools.slice(0, maxTools);

  if (relatedTools.length === 0) {
    return null;
  }

  return (
    <div className="mt-20 pt-16 border-t border-neutral-200 dark:border-neutral-800">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Related Tools</h2>
        <ul className="space-y-3">
          {relatedTools.map(tool => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="group flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                <ArrowRight className="w-4 h-4 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                <span className="font-medium">{tool.name}</span>
                <span className="text-sm text-neutral-500 dark:text-neutral-500">— {tool.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium transition-colors"
        >
          View all tools
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
