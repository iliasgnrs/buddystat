"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { userStore } from "../lib/userStore";
import { useGetSiteIsPublic } from "../api/admin/hooks/useSites";

const PUBLIC_ROUTES = ["/login", "/signup", "/invitation", "/reset-password", "/as/callback"];

export function AuthenticationGuard() {
  const { user, isPending } = userStore();
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  // Extract potential siteId from path like /{siteId} or /{siteId}/something
  const pathSegments = pathname.split("/").filter(Boolean);
  const potentialSiteId = pathSegments.length > 0 && !isNaN(Number(pathSegments[0])) ? pathSegments[0] : undefined;

  // Check if there's a private key in the URL (second segment is 12 hex chars)
  const hasPrivateKey = pathSegments.length > 1 && /^[a-f0-9]{12}$/i.test(pathSegments[1]);

  // Use Tanstack Query to check if site is public
  const { data: isPublicSite, isLoading: isCheckingPublic } = useGetSiteIsPublic(potentialSiteId);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    hasRedirectedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    // Only redirect if:
    // 1. We're not checking public status anymore
    // 2. User is not logged in
    // 3. Not on a public route
    // 4. Not on a public site
    // 5. Not using a private link key
    // 6. Haven't already redirected
    if (
      !isPending &&
      !isCheckingPublic &&
      !user &&
      !PUBLIC_ROUTES.includes(pathname) &&
      !isPublicSite &&
      !hasPrivateKey &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      router.push("/login");
    }
  }, [isPending, user, pathname, isCheckingPublic, isPublicSite, hasPrivateKey, router]);

  return null; // This component doesn't render anything
}
