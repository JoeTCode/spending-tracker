import { useState } from "react";

const Switch = ({ enabled, setEnabled })  => {

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
      />
      <div className="w-9 h-5 bg-gray-400 rounded-full peer-checked:bg-[#646cff] transition-colors duration-200 ease-in">
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in
          ${enabled ? "translate-x-4" : "translate-x-0"}`}
        />
      </div>
    </label>
  );
}

export default Switch;
