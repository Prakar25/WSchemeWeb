/* eslint-disable react/prop-types */
import React from "react";
import { FiPlus, FiX } from "react-icons/fi";
import Error from "../../outputs/Error";

export default function ArrayInput({
  defaultName,
  register,
  name,
  required = false,
  errors,
  setValue,
  data = [],
  placeholder = "Enter item",
  showInput = true,
  ...rest
}) {
  // Initialize with empty array or convert data to array
  const [items, setItems] = React.useState(() => {
    if (Array.isArray(data)) {
      return data.length > 0 ? data : [""];
    }
    // Handle backward compatibility: convert HTML string to array
    if (typeof data === "string" && data.trim()) {
      // Try to parse HTML divs
      const divMatches = data.match(/<div[^>]*>(.*?)<\/div>/g);
      if (divMatches) {
        return divMatches.map((div) =>
          div.replace(/<[^>]*>/g, "").trim()
        );
      }
      // Fallback: split by newlines
      return data
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
    }
    return [""];
  });

  // Update form value when items change
  React.useEffect(() => {
    const filteredItems = items.filter((item) => item.trim() !== "");
    setValue(defaultName, filteredItems.length > 0 ? filteredItems : [""], {
      shouldValidate: true,
    });
  }, [items, defaultName, setValue]);

  const handleItemChange = (index, value) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, ""]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  if (showInput === false) return null;

  return (
    <div className="w-full mb-6">
      <p className="font-bold text-left mb-2">
        {name} {required && <span className="text-red-700">*</span>}
      </p>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Remove item"
              >
                <FiX size={18} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
      >
        <FiPlus size={16} />
        Add {name}
      </button>

      {required &&
        items.filter((item) => item.trim() !== "").length === 0 && (
          <Error
            classes="flex gap-1 mt-1"
            message={`${name} is required. Please add at least one item.`}
          />
        )}
    </div>
  );
}

