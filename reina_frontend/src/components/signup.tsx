import axios from "axios";
import { useFormHook } from "../hooks/useFormHook";
import { signupSchema } from "../schema/auth";
import { z } from "zod";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  type SignupFormData = z.infer<typeof signupSchema>;

  const signupUser = async (data: SignupFormData) => {
    const result = await axios.post("http://localhost:8000/signup", data);
    return result.data;
  };

  const {
    register,
    handleSubmit,
    isPending,
    isSuccess,
    apiError,
    errors,
    mutationError,
  } = useFormHook(signupSchema, signupUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess) {
      navigate("/login");
    }
  }, [navigate, isSuccess]);

  return (
    <div className="min-h-screen  flex justify-center items-center bg-gray-100">
      <div className="w-full bg-white shadow-lg max-w-md p-8 rounded-lg">
        <h1 className="font-bold text-gray-900 text-md md:text-lg lg:text-2xl mb-6 text-center">
          Sign Up
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
              className=" mt-1 block w-full outline-none rounded-md border border-gray-300"
            />
            {errors.username && (
              <p className="text-red-600 mt-1 text-sm">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block font-medium text-gray-700 text-sm"
            >
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              id="email"
              className=" mt-1 block w-full outline-none rounded-md border border-gray-300"
            />
            {errors.email && (
              <p className="text-red-600 mt-1 text-sm">
                {errors.email.message}
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
              className=" mt-1 block w-full outline-none rounded-md border border-gray-300"
            />
            {errors.password && (
              <p className="text-red-600 mt-1 text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          {apiError && mutationError && (
            <p className="text-sm text-red-600">
              Error:{mutationError?.message || "Signup failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full text-center p-2 rounded-sm bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300"
          >
            {isPending ? "Signing Up..." : "Sign Up"}
          </button>
          <Link to="/login">already have an account?? sign in</Link>
        </form>
      </div>
    </div>
  );
};

export default Signup;
