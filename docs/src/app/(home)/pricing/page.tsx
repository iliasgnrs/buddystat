import type { Metadata } from "next";
import { PricingPageClient } from "./components/PricingPageClient";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Rybbit pricing plans and features",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
