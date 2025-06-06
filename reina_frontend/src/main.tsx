import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Signup from "./components/signup.tsx";
import Login from "./components/login.tsx";
import Dashboard from "./Dashboard.tsx";
import WelcomeScreen from "./components/welcomeScreen.tsx";
import NotificationScreen from "./components/NotificationScreen.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <WelcomeScreen /> },
      { path: "/signup", element: <Signup /> },
      { path: "/login", element: <Login /> },
      {
        path: "/dashboard",
        element: <Dashboard />,
        errorElement: (
          <div className="p-4 text-red-600">
            An error occurred. Please try again or contact support.
          </div>
        ),
      },
      { path: "/notifications", element: <NotificationScreen /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
