import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  sizes?: "xs" | "sm" | "md" | "lg";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      name,
      label,
      placeholder,
      required,
      readOnly,
      error,
      sizes = "md",
      ...rest
    },
    ref
  ) => {
    const showLabel = !placeholder;
    const labelClass = {
      xs: "text-[10px] xl:text-xs",
      sm: "text-md xl:text-sm",
      md: "text-md md:text-base",
      lg: "text-md md:text-lg",
    }[sizes];
    const sizeClass = {
      xs: "text-xs px-2 py-1",
      sm: "text-sm px-2 py-1.5",
      md: "text-base px-3 py-2",
      lg: "text-lg px-4 py-3",
    }[sizes];

    return (
      <div className="flex flex-1 flex-col gap-1 relative">
        {showLabel && (
          <label
            htmlFor={name}
            className={`${labelClass} font-semibold text-gray-700`}
          >
            {label}
          </label>
        )}
        <textarea
          id={name}
          name={name}
          ref={ref}
          required={required}
          readOnly={readOnly}
          placeholder={placeholder || (showLabel ? "" : label)}
          className={`w-full border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2
            ${
              readOnly
                ? "bg-gray-100 cursor-not-allowed"
                : "focus:ring-blue-400"
            }
            ${sizeClass} resize-none`}
          {...rest}
        />
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
