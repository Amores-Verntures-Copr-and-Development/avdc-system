import React, { useEffect, useState } from "react";

import { Bell } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { StoreInterface } from "@/types/stores";
const Header = () => {
  const { user } = useSession();
  const [storeData, setStoreData] = useState<StoreInterface | null>(null);
  useEffect(() => {
    // Get store data from localStorage
    const storedStoreData = localStorage.getItem("storeData");

    if (storedStoreData) {
      try {
        const parsedData = JSON.parse(storedStoreData);
        setStoreData(parsedData);
      } catch (error) {
        console.error("Error parsing storeData:", error);
      }
    }
  }, [user]);
  return (
    <div className="flex justify-between h-8 md:h-13 xl:h-15 items-center pr-2 pl-2 shadow  bg-white overflow-visible">
      <div className="flex flex-col">
        <span className="font-semibold">{storeData?.storeName}</span>
      </div>
      <div className="flex gap-5 items-center">
        <div className="relative flex items-center justify-center w-5 h-5 xl:w-9 xl:h-9 rounded-full bg-gray-300 text-white">
          <Bell className="w-2.5 h-2.5 xl:w-6 xl:h-6" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2  xl:h-4 xl:w-4 items-center justify-center rounded-full bg-red-500 text-[8px] xl:text-[10px] font-bold text-white">
            3
          </span>
        </div>
        <div className="flex items-center justify-center w-5 h-5 xl:w-9 xl:h-9 rounded-full bg-primary-1 text-xs xl:text-xl font-bold text-white">
          {user?.userFullName.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export default Header;
