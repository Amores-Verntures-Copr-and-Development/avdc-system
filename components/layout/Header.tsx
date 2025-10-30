import React from "react";
import Image from "next/image";
import { Bell } from "lucide-react";
const Header = () => {
  return (
    <div className="flex h-15 justify-between items-center pr-2 shadow bg-white overflow-visible">
      <div className="relative w-64 h-15">
        <Image
          src="/avdclogo.png"
          alt="Logo"
          fill // Use a fixed number instead of 0
          className="object-contain"
        />
      </div>
      <div className="flex gap-5 items-center">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gray-300 text-white">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-1 text-xl font-bold text-white">
          A
        </div>
      </div>
    </div>
  );
};

export default Header;
