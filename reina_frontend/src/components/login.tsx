import { loginSchema } from "../schema/auth";
import { z } from "zod";
import { useFormHook } from "../hooks/useFormHook";
import axios from "axios";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginStore } from "../Store/useLoginStore";

const Login = () => {
  type LoginFormData = z.infer<typeof loginSchema>;

  type LoginResponse = {
    access_token: string;
    request_token: string;
    token_type: string;
  };

  const loginUser = async (data: LoginFormData): Promise<LoginResponse> => {
    const formData = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await axios.post("http://localhost:8000/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return result.data;
  };

  const {
    register,
    handleSubmit,
    errors,
    isPending,
    isSuccess,
    mutationError,
    apiError,
    mutationData,
  } = useFormHook(loginSchema, loginUser);
  const { setTokens } = useLoginStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (isSuccess && mutationData) {
      const { access_token, request_token, token_type } =
        mutationData as LoginResponse;
      setTokens(access_token, request_token, token_type);
      navigate("/dashboard");
    }
  }, [navigate, isSuccess, mutationData, setTokens]);

  return (
    <div className="min-h-screen  flex justify-center items-center bg-gray-100">
      <div className="w-full bg-white shadow-lg max-w-md p-8 rounded-lg">
        <h1 className="font-bold text-gray-900 text-md md:text-lg lg:text-2xl mb-6 text-center">
          Sign In
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block font-medium text-gray-700 text-sm"
            >
              Username
            </label>
            <input
              type="text"
              {...register("username")}
              id="username"
              className=" mt-1 block w-full outline-none rounded-md border border-gray-300 p-2"
            />
            {errors.username && (
              <p className="text-red-600 mt-1 text-sm">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-medium text-gray-700 text-sm"
            >
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              id="password"
              className=" mt-1 block w-full outline-none rounded-md border border-gray-300 p-2"
            />
            {errors.password && (
              <p className="text-red-600 mt-1 text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          {apiError && mutationError && (
            <p className="text-sm text-red-600">
              Error:{mutationError?.message || "Login failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full text-center p-2 rounded-sm bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300"
          >
            {isPending ? "Logging in..." : "Sign in"}
          </button>
          <Link to="/signup">don't have and account?? sign up</Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
