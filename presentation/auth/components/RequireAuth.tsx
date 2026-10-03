import { usePathname, useRouter } from "expo-router";
import { PropsWithChildren, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

export default function RequireAuth({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (status !== "unauthenticated") return;
    void useAuthStore.getState().setLastRoute(pathname);
    router.replace({ pathname: "/auth/login", params: { returnTo: pathname } });
  }, [status, pathname, router]);
  // Do not mount personal queries/effects until a real user is authenticated.
  return status === "authenticated" ? children : null;
}
