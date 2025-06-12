import { useEffect } from "react";
import expenseTrackerImage from "../assets/expense-tracker.webp";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/signup"), 5000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-gray-100 to-blue-300 flex justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')] opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-1/3 bg-blue-500 opacity-20 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-full h-1/3 bg-blue-300 opacity-20 blur-3xl rounded-full"></div>

      <div className="flex flex-col py-8 justify-center items-center text-center max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <img
            src={expenseTrackerImage}
            alt="Expense-tracker welcome image"
            className="w-40 h-auto animate-zoom-in rounded-full shadow-lg border-4 border-white"
          />
        </div>

        <h1 className="text-blue-500 font-bold text-sm md:text-5xl lg:text-7xl animate-zoom-in mb-4">
          Welcome to ExTrack
        </h1>

        <p className="text-gray-700 text-sm md:text-base lg:text-lg animate-fade-in max-w-md">
          Take control of your finances with ease. Track, manage, and save
          smarter!
        </p>

        <div className="mt-6 flex items-center justify-center">
          <div className="w-48 h-1 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-progress"></div>
          </div>
          <span className="ml-3 text-gray-600 text-sm">Redirecting...</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
