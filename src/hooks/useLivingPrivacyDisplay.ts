"use client";

import { usePublicSession } from "@/hooks/usePublicSession";
import { formatMinimalLivingLabel } from "@/lib/auth/living-person-privacy";

export function useLivingPrivacyDisplay() {
  const { isAuthenticated, isLoading } = usePublicSession();

  function shouldShowMinimalLiving(isLiving: boolean): boolean {
    return isLiving && !isAuthenticated;
  }

  return {
    isAuthenticated,
    isLoading,
    shouldShowMinimalLiving,
    formatMinimalLivingLabel,
  };
}
