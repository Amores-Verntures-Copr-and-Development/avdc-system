import { DisplayTotalOrderItem } from "@/dtos/request.dto";
import { DisplayItemConversionFromTo } from "@/dtos/items.dto";
import { fetcher } from "@/utils/fetcher";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

interface ConvertSideModalProps {
  data: DisplayTotalOrderItem | null;
  onConvert?: (
    conversion: DisplayItemConversionFromTo,
    quantity: number,
    convertedFrom: DisplayTotalOrderItem | null,
  ) => void;
}

const ConvertSideModal = ({ data, onConvert }: ConvertSideModalProps) => {
  const { data: itemResponse = { data: [] } } = useSWR<{
    data: DisplayItemConversionFromTo[];
  }>(data ? `/api/items/${data.itemId}/conversion` : null, fetcher);

  const [selectedConversionId, setSelectedConversionId] = useState<
    number | null
  >(null);

  const [quantity, setQuantity] = useState<number>(1);
  useEffect(() => {
    if (itemResponse.data && itemResponse.data.length > 0) {
      const findConvert = itemResponse.data.find(
        (i) => i.itemConId === selectedConversionId,
      );
      if (findConvert) {
        setQuantity(
          Number(data?.totalQuantity) / Number(findConvert.fromQuantity),
        );
      }
    }
  }, [selectedConversionId]);
  const handleConvert = () => {
    if (!selectedConversionId) return alert("Please select a conversion!");
    const conversion = itemResponse.data.find(
      (c) => c.itemConId === selectedConversionId,
    );
    if (!conversion) return;

    onConvert?.(conversion, quantity, data);
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded shadow-md w-full max-w-md">
      <h2 className="text-lg font-bold">Convert Item</h2>

      <p>
        Original Item:{" "}
        <strong>
          {data?.itemName}({data?.totalQuantity} {data?.itemUnit})
        </strong>
      </p>

      <div className="flex flex-col gap-2">
        {itemResponse.data.length === 0 && <p>No conversions available</p>}

        {itemResponse.data.map((conversion) => (
          <label
            key={conversion.itemConId}
            className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
              selectedConversionId === conversion.itemConId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="conversion"
              value={conversion.itemConId}
              checked={selectedConversionId === conversion.itemConId}
              onChange={() => setSelectedConversionId(conversion.itemConId)}
            />
            <span className="text-xs 2xl:text-sm">
              {conversion.toItemName} ({conversion.fromQuantity}{" "}
              {conversion.fromUnit} = {conversion.toQuantity}{" "}
              {conversion.toUnit})
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label>Quantity:</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-20"
          min={1}
          value={quantity === 0 ? "" : quantity}
          name="quantity"
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      <button
        onClick={handleConvert}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Convert
      </button>
    </div>
  );
};

export default ConvertSideModal;
