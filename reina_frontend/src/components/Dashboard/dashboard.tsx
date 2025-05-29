import { useState } from "react";
import ExpenseCard from "./ExpenseCard";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div
        className={`fixed inset-y-0 left-0 bg-white shadow-lg w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform lg:translate-x-0 lg:static`}
      >
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-800">Dashboard</h2>
          <ul className="mt-6 space-y-4">
            <li>
              <a
                href="#"
                className="block text-gray-700 hover:text-blue-500 font-medium"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block text-gray-700 hover:text-blue-500 font-medium"
              >
                Profile
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block text-gray-700 hover:text-blue-500 font-medium"
              >
                Notifications
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-md p-4 flex items-center justify-between">
          <button
            className="lg:hidden text-gray-700"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          <h1 className="text-lg font-bold text-gray-800">Navbar</h1>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-gray-100 h-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 rounded-lg shadow-md">
            <ExpenseCard />
            <ExpenseCard />
            <ExpenseCard />
            <ExpenseCard />
            <ExpenseCard />
            <ExpenseCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
