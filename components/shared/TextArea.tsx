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
    // Mirrors Input's labelClass/sizeClass scales exactly (same text sizes,
    // horizontal padding, border/focus colors) so a Textarea sitting next to
    // an Input reads as the same field style, just taller.
    const labelClass = {
      xs: "text-[10px]",
      sm: "text-[10px] xl:text-xs",
      md: "text-xs xl:text-sm",
      lg: "text-sm xl:text-base",
    }[sizes];
    const sizeClass = {
      xs: "min-h-16 text-[11px] px-2 py-1.5",
      sm: "min-h-20 text-xs xl:text-sm px-2 py-2",
      md: "min-h-24 text-xs xl:text-sm px-3 py-2",
      lg: "min-h-28 text-sm md:text-base px-3 py-2.5",
    }[sizes];

    return (
      <div className="flex flex-1 flex-col gap-1 relative">
        {showLabel && (
          <label
            htmlFor={name}
            className={`${labelClass} font-medium text-gray-500`}
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
          className={`w-full border border-gray-200 text-black rounded-lg
            transition-colors placeholder:text-gray-400
            focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400
            ${readOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            ${sizeClass} resize-none`}
          {...rest}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
