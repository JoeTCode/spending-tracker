const ProgressBar = ({ current, total, label }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-200">{label}</span>
            <span className="text-sm font-medium text-gray-400">
                {current}/{total}
            </span>
        </div>
        <div className="w-full bg-neutral-700 rounded-full h-3">
            <div
            //   className="bg-gradient-to-r from-[#646cff] via-[#3a41c4] to-[#2f3492] h-3 rounded-full transition-all duration-500 ease-in-out"
                className="h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${percentage}%`, backgroundColor: "#646cff" }}
            />
        </div>
    </div>
  );
};

export default ProgressBar;