const ExpenseCard = () => {
  return (
    <div className="w-48 h-auto shadow-lg bg-white rounded-md p-4">
      <div className="w-[20px] h-[20px] bg-pink-500 relative top-1 mb-1 rounded-3xl"></div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400 font-bold mr-7">Food</p>
        <p className="text-sm text-gray-400 font-bold">
          <span>$1000</span>
        </p>
      </div>
    </div>
  );
};

export default ExpenseCard;
