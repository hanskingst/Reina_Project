import { useEffect } from "react";
import expenseTrackerImage from "../assets/expense-tracker.webp";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/signup"), 5000);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center ">
      <div className="flex flex-col py-4 justify-center items-center">
        <div className="text-center">
          <img
            src={expenseTrackerImage}
            alt="Expense-tracker welcome image"
            className=" w-40 h-auto animate-zoom-in"
          />
        </div>
        <p className="text-blue-500 font-bold text-sm md:text-lg lg:text-2xl animate-zoom-in">
          Start tracking your expenses !
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
