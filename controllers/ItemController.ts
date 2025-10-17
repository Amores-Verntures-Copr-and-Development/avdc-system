import { findItemsBySearch } from "@/services/itemServices";

export const getItemBySearch = async (search: string) => {
  try {
    const data = await findItemsBySearch(search);
    return {
      data: data,
      message: "Item fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: "Failed to fetched item!",
      success: false,
    };
  }
};
