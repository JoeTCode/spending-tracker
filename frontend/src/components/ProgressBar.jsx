const ProgressBar = ({ current, total, label }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium dark:text-gray-200">{label}</span>
            <span className="text-sm font-medium dark:text-gray-400">
                {current}/{total}
            </span>
        </div>
        <div className="w-full bg-neutral-400 dark:bg-neutral-700 rounded-full h-3">
            <div
                className="h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${percentage}%`, backgroundColor: "#646cff" }}
            />
        </div>
    </div>
  );
};

export default ProgressBar;