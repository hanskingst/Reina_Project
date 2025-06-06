import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormHook } from "./hooks/useFormHook";
import { expenseSchema } from "./schema/expenseSchema";
import {
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  fetchTotalSpent,
  fetchMonthlySpent,
} from "./api/expenseAPI";
import type { Expense, ExpenseUpdate } from "./api/expenseAPI";
import { fetchNotifications, addNotification } from "./api/notificationAPI";
import type { Notification } from "./api/notificationAPI";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { useLoginStore } from "./Store/useLoginStore";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useState, useEffect } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { clearTokens, name, netIncome, updateNetIncome, accessToken } =
    useLoginStore();
  const queryClient = useQueryClient();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  useEffect(() => {
    console.log("Access Token on Mount:", accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  // Fetch expenses with pagination
  const {
    data: expenseData = { items: [], total: 0, limit, page: 1 },
    isLoading: expensesLoading,
    isError: expensesError,
    error: expensesFetchError,
  } = useQuery({
    queryKey: ["expenses", currentPage],
    queryFn: () => fetchExpenses(currentPage, limit),
    enabled: !!accessToken,
  });

  const expenses = expenseData.items;
  const totalPages = Math.ceil(expenseData.total / expenseData.limit);

  // Fetch total spent
  const {
    data: totalSpent = 0,
    isLoading: totalSpentLoading,
    isError: totalSpentError,
    error: totalSpentFetchError,
  } = useQuery({
    queryKey: ["totalSpent"],
    queryFn: fetchTotalSpent,
    enabled: !!accessToken,
  });

  // Fetch monthly spent
  const {
    data: monthlySpent = 0,
    isLoading: monthlySpentLoading,
    isError: monthlySpentError,
    error: monthlySpentFetchError,
  } = useQuery({
    queryKey: ["monthlySpent"],
    queryFn: fetchMonthlySpent,
    enabled: !!accessToken,
  });

  // Fetch notifications for badge
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    error: notificationsFetchError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!accessToken,
  });

  // Log errors for debugging
  useEffect(() => {
    if (expensesFetchError) {
      console.error("Expenses Fetch Error:", expensesFetchError);
    }
    if (totalSpentFetchError) {
      console.error("Total Spent Fetch Error:", totalSpentFetchError);
    }
    if (monthlySpentFetchError) {
      console.error("Monthly Spent Fetch Error:", monthlySpentFetchError);
    }
    if (notificationsFetchError) {
      console.error("Notifications Fetch Error:", notificationsFetchError);
    }
  }, [
    expensesFetchError,
    totalSpentFetchError,
    monthlySpentFetchError,
    notificationsFetchError,
  ]);

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: Notification) => !n.is_read).length
    : 0;

  const {
    register,
    handleSubmit,
    errors,
    isPending: addPending,
  } = useFormHook(expenseSchema, (data) =>
    addExpense({
      ...data,
      Date: data.date,
    })
  );

  // Mutations for updating and deleting expenses
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<ExpenseUpdate, "id">;
    }) => updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["totalSpent"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySpent"] });
      setEditingExpense(null);
    },
    onError: () => {
      alert("Failed to update expense");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["totalSpent"] });
      queryClient.invalidateQueries({ queryKey: ["monthlySpent"] });
    },
    onError: () => {
      alert("Failed to delete expense");
    },
  });

  // Mutation for adding notifications
  const addNotificationMutation = useMutation({
    mutationFn: addNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        console.error("Failed to add notification:", error.message);
      } else {
        console.error("Failed to add notification:", error);
      }
    },
  });

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleLogout = () => {
    clearTokens();
    navigate("/login");
  };

  // Check if total spent exceeds net income and trigger notification
  useEffect(() => {
    if (totalSpent > netIncome && netIncome > 0) {
      const message = `Your expenses ($${totalSpent.toFixed(
        2
      )}) have exceeded your net income ($${netIncome.toFixed(2)})!`;
      const notificationExists = notifications.some(
        (n: Notification) => n.message === message && !n.is_read
      );
      if (!notificationExists) {
        addNotificationMutation.mutate(message);
      }
    }
  }, [totalSpent, netIncome, notifications, addNotificationMutation]);

  // Prepare chart data
  const categories = Array.isArray(expenses)
    ? [...new Set(expenses.map((exp: Expense) => exp.category))]
    : [];
  const categoryData = categories.map((cat: string) =>
    Array.isArray(expenses)
      ? expenses
          .filter((exp: Expense) => exp.category === cat)
          .reduce((sum: number, exp: Expense) => sum + exp.amount, 0)
      : 0
  );

  const barChartData = {
    labels: categories,
    datasets: [
      {
        label: "Spending by Category",
        data: categoryData,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  // Pie chart data
  const pieChartData = {
    labels: categories,
    datasets: [
      {
        label: "Expense Distribution",
        data: categoryData,
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
      },
    ],
  };

  // Line chart data (Spending Over Time)
  const dates = Array.isArray(expenses)
    ? [...new Set(expenses.map((exp: Expense) => exp.date))].sort()
    : [];
  const spendingByDate = dates.map((date: string) =>
    Array.isArray(expenses)
      ? expenses
          .filter((exp: Expense) => exp.date === date)
          .reduce((sum: number, exp: Expense) => sum + exp.amount, 0)
      : 0
  );

  const lineChartData = {
    labels: dates,
    datasets: [
      {
        label: "Spending Over Time",
        data: spendingByDate,
        borderColor: "rgba(75, 192, 192, 1)",
        fill: false,
      },
    ],
  };

  // Calculate remaining income for progress bar
  const remainingIncome = netIncome - totalSpent;
  const expensePercentage = netIncome > 0 ? (totalSpent / netIncome) * 100 : 0;

  // Handle edit
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  // Handle income update form submission
  const handleIncomeUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newIncome = Number(formData.get("netIncome"));
    if (newIncome >= 0) {
      updateNetIncome(newIncome);
    } else {
      alert("Net income must be a positive number.");
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-gray-800 text-white p-4">
        <h1 className="text-lg font-semibold">
          Hello {name || "User"}, welcome to your expense tracker
        </h1>
      </div>

      {/* Navbar */}
      <nav className="bg-gray-800 text-white p-4 flex justify-end items-center">
        <button
          className="md:hidden p-2 rounded hover:bg-gray-700 focus:outline-none"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </nav>

      <div className="flex flex-1 min-h-[calc(100vh-128px)]">
        <aside
          className={`bg-gray-800 text-white w-64 p-4 fixed top-0 left-0 min-h-screen transition-transform transform md:transform-none md:static ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 z-20 pt-0`}
        >
          <h2 className="text-xl font-bold mb-6 text-left">
            Reina Expense Tracker
          </h2>
          <nav>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="block p-2 rounded hover:bg-gray-700"
                  onClick={() => {
                    console.log("Navigating to Dashboard");
                    setIsSidebarOpen(false);
                  }}
                >
                  Dashboard
                </Link>
              </li>
              <li className="relative">
                <Link
                  to="/notifications"
                  className="block p-2 rounded hover:bg-gray-700"
                  onClick={() => {
                    console.log("Navigating to Notifications");
                    setIsSidebarOpen(false);
                  }}
                >
                  Notifications
                  {notificationsLoading ? (
                    <span className="absolute top-1 right-2 text-xs text-gray-300">
                      ...
                    </span>
                  ) : unreadCount > 0 ? (
                    <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center" />
                  ) : null}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsSidebarOpen(false);
                  }}
                  className="block w-full text-left p-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-50 md:hidden z-10"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4">
          <Outlet />

          {(expensesError ||
            notificationsError ||
            totalSpentError ||
            monthlySpentError) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>
                {expensesError && "Failed to load expenses. "}
                {totalSpentError && "Failed to load total spent. "}
                {monthlySpentError && "Failed to load monthly spent. "}
                {notificationsError && "Failed to load notifications. "}
                Please check your connection or login again.
              </p>
              <button
                onClick={() => {
                  clearTokens();
                  navigate("/login");
                }}
                className="mt-2 bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Login Again
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">Total Spent</h2>
              {totalSpentLoading ? (
                <p className="text-2xl">Loading...</p>
              ) : (
                <p className="text-2xl">${totalSpent.toFixed(2)}</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">This Month</h2>
              {monthlySpentLoading ? (
                <p className="text-2xl">Loading...</p>
              ) : (
                <p className="text-2xl">${monthlySpent.toFixed(2)}</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">Budget Status</h2>
              {totalSpentLoading ? (
                <p className="text-2xl">Loading...</p>
              ) : (
                <p className="text-2xl">
                  {totalSpent > netIncome && netIncome > 0
                    ? "Over Budget"
                    : "Within Budget"}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-2">Net Income Status</h2>
              {totalSpentLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <p>Remaining Income: ${remainingIncome.toFixed(2)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div
                      className={`h-4 rounded-full ${
                        expensePercentage > 75 ? "bg-red-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(expensePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm mt-1">
                    {expensePercentage.toFixed(2)}% of your income spent
                  </p>
                </>
              )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-2">Update Net Income</h2>
              <form onSubmit={handleIncomeUpdate} className="space-y-2">
                <div>
                  <label
                    htmlFor="netIncome"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Net Income
                  </label>
                  <input
                    type="number"
                    id="netIncome"
                    name="netIncome"
                    defaultValue={netIncome}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                >
                  Update Income
                </button>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">
                Spending by Category
              </h2>
              <Bar data={barChartData} options={{ responsive: true }} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Spending Over Time</h2>
              <Line data={lineChartData} options={{ responsive: true }} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">
                Expense Distribution
              </h2>
              <Pie data={pieChartData} options={{ responsive: true }} />
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => {
                setEditingExpense(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              Add New Expense
            </button>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-30 flex items-center justify-center z-30">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-lg font-semibold mb-4">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </h2>
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                    if (editingExpense && !addPending) {
                      const formData = new FormData(e.currentTarget);
                      const data = {
                        amount: Number(formData.get("amount")),
                        category: formData.get("category") as string,
                        Date: formData.get("date") as string,
                      };
                      updateMutation.mutate({
                        id: editingExpense.id,
                        data,
                      });
                    }
                    if (!addPending && !updateMutation.isPending) {
                      queryClient.invalidateQueries({ queryKey: ["expenses"] });
                      queryClient.invalidateQueries({
                        queryKey: ["totalSpent"],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["monthlySpent"],
                      });
                      setIsModalOpen(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      defaultValue={editingExpense?.amount?.toString() || ""}
                      {...register("amount", { valueAsNumber: true })}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                    {errors.amount && (
                      <p className="text-red-600 mt-1 text-sm">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      defaultValue={editingExpense?.category || ""}
                      {...register("category")}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                    {errors.category && (
                      <p className="text-red-600 mt-1 text-sm">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      defaultValue={editingExpense?.date || ""}
                      {...register("date")}
                      className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    />
                    {errors.date && (
                      <p className="text-red-600 mt-1 text-sm">
                        {errors.date?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={addPending || updateMutation.isPending}
                      className="flex-1 w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                    >
                      {editingExpense
                        ? updateMutation.isPending
                          ? "Updating..."
                          : "Update Expense"
                        : addPending
                        ? "Adding..."
                        : "Add Expense"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingExpense(null);
                      }}
                      className="flex-1 w-full px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Recent Expenses</h2>
            {expensesLoading ? (
              <p>Loading...</p>
            ) : Array.isArray(expenses) && expenses.length === 0 ? (
              <p>No expenses found.</p>
            ) : Array.isArray(expenses) ? (
              <>
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="p-2 border-b">Amount</th>
                      <th className="p-2 border-b">Category</th>
                      <th className="p-2 border-b">Date</th>
                      <th className="p-2 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense: Expense) => {
                      console.log("Expense object:", expense);
                      return (
                        <tr key={expense.id}>
                          <td className="p-2 border-b">
                            ${expense.amount.toFixed(2)}
                          </td>
                          <td className="p-2 border-b">{expense.category}</td>
                          <td className="p-2 border-b">{expense.date}</td>
                          <td className="p-2 border-b">
                            <div className="space-x-2">
                              <button
                                onClick={() => {
                                  handleEdit(expense);
                                  setIsModalOpen(true);
                                }}
                                className="bg-yellow-500 text-white p-1 px-5 rounded-lg hover:bg-yellow-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  console.log(
                                    "Deleting expense with id:",
                                    expense.id
                                  );
                                  handleDelete(expense.id);
                                }}
                                className="bg-red-600 text-white p-1 px-5 rounded-lg hover:bg-red-700"
                                disabled={deleteMutation.isPending}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="bg-gray-500 text-white p-2 rounded-md disabled:bg-gray-300 hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="bg-gray-500 text-white p-2 rounded-md disabled:bg-gray-300 hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <p>Error loading expenses.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
