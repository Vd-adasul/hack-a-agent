import { useMemo } from "react";
import { request } from "../utils/api";

export function useApi(token) {
  const authHeaders = useMemo(() => ({ token }), [token]);

  return {
    makeRequest: (path, options = {}) => request(path, { ...authHeaders, ...options }),
    authHeaders
  };
}
