import { auth } from "@/lib/firebase";

/**
 * Fetch wrapper that automatically attaches the firebase_jwt token,
 * and on 401, force-refreshes the token and retries once.
 */
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  // Helper to get token from localStorage
  const getToken = () => localStorage.getItem("firebase_jwt");

  // Attach token to headers
  const withAuth = (token: string) => ({
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  let token = getToken();
  let res = await fetch(input, withAuth(token!));

  if (res.status === 401 && auth.currentUser) {
    // Check expiry before refreshing token
    const expiresAt = localStorage.getItem("firebase_jwt_expires_at");
    const now = Date.now();
    if (expiresAt && now > Number(expiresAt)) {
      // Token expired, logout user
      try {
        await auth.signOut();
      } catch { /* empty */ }
      localStorage.removeItem("firebase_jwt");
      localStorage.removeItem("firebase_jwt_expires_at");
      window.location.href = "/login";
      return res; // Optionally return the 401 response
    } else {
      // Force refresh token and set new expiry
      token = await auth.currentUser.getIdToken(true);
      localStorage.setItem("firebase_jwt", token);
      // Set expiry to 4 hours from now
      const newExpiry = Date.now() + 4 * 60 * 60 * 1000;
      localStorage.setItem("firebase_jwt_expires_at", newExpiry.toString());
      console.log("[onApiRefresh] new token set (force refresh)", token, "expires at", new Date(newExpiry));
      // Retry the request once with the new token
      res = await fetch(input, withAuth(token));
    }
  }

  return res;
}
