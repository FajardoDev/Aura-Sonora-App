import { usePathname, useRouter } from "expo-router";
import { useAuthStore } from "../store/useAuthStore";

export function getAuthReturnRoute(route?: string | null) {
  return route && route.startsWith("/") && !route.startsWith("//") &&
    !/^\/(?:auth|\(auth\))(?:\/|$)/.test(route)
    ? route : "/home";
}

export function useAuthNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);
  const requestLogin = (destination = pathname, replace = false) => {
    const returnTo = getAuthReturnRoute(destination);
    void useAuthStore.getState().setLastRoute(returnTo);
    const target = { pathname: "/auth/login" as const, params: { returnTo } };
    if (replace) router.replace(target);
    else router.push(target);
  };
  const requireAuth = (destination = pathname) => {
    if (status === "authenticated") return true;
    requestLogin(destination);
    return false;
  };
  return { status, requestLogin, requireAuth };
}
