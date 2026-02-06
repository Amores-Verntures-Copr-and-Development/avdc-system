import React, { useState } from "react";

interface CheckboxItem {
  id: string | number;
  label: string;
}

interface DynamicCheckboxProps {
  items: CheckboxItem[];
  onChange?: (selected: string[]) => void; // callback when selection changes
}

const DynamicCheckbox: React.FC<DynamicCheckboxProps> = ({
  items,
  onChange,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleToggle = (id: string | number) => {
    let updated: string[];
    if (selectedItems.includes(String(id))) {
      // Remove if already selected
      updated = selectedItems.filter((item) => item !== String(id));
    } else {
      // Add if not selected
      updated = [...selectedItems, String(id)];
    }
    setSelectedItems(updated);

    // Trigger callback
    if (onChange) onChange(updated);
  };

  return (
    <div className="flex">
      {items.map((item) => (
        <label key={item.id} className="text-black">
          <input
            type="checkbox"
            checked={selectedItems.includes(String(item.id))}
            onChange={() => handleToggle(item.id)}
          />
          <span style={{ marginLeft: 6 }}>{item.label}</span>
        </label>
      ))}
    </div>
  );
};

export default DynamicCheckbox;
