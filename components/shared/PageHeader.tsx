import React from "react";
interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <div>
      <h1 className="text-lg sm:text-sm lg:text-2xl font-bold text-gray-900">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-xs lg:text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
