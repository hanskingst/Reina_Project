import { useFormHook } from "../hooks/useFormHook";
import { loginSchema } from "../schema/auth";
import { loginUser, getCurrentUser } from "../api/authAPI";
import { useNavigate } from "react-router-dom";
import { useLoginStore } from "../Store/useLoginStore";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { setTokens } = useLoginStore();
  const [loginError, setLoginError] = useState<string | null>(null);

  const { register, handleSubmit, errors, isPending } = useFormHook(
    loginSchema,
    async (data) => {
      try {
        const loginResponse = await loginUser(data);

        setTokens(
          loginResponse.access_token,
          loginResponse.token_type,
          loginResponse.refresh_token,
          "TempUser"
        );

        const userResponse = await getCurrentUser();

        setTokens(
          loginResponse.access_token,
          loginResponse.token_type,
          loginResponse.refresh_token,
          userResponse.user_name || "User"
        );

        setLoginError(null);
        navigate("/dashboard");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.";
        setLoginError(errorMessage);
      }
    }
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {loginError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{loginError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              {...register("username")}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
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
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.password && (
              <p className="text-red-600 mt-1 text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isPending ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
