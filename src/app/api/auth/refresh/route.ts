import { proxyAdminAuthRequest } from "@/lib/auth/admin-auth-proxy";

export async function POST(request: Request) {
  return proxyAdminAuthRequest(request, "/api/auth/refresh", "POST");
}
