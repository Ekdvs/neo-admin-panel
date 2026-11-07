
import api from "@/lib/axios";

import type {
  LoginInput,
  ApiResponse,
  LoginResponse,
} from "@/types/auth.types";

export const authService = {
  login: async (
    credentials: LoginInput
  ): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<
      ApiResponse<LoginResponse>
    >("/api/auth/login", credentials);

    return response.data;
  },
};
