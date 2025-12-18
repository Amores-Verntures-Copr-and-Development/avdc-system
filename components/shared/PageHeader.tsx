import React from "react";
interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <div>
      <h1 className="text-xs  xl:text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && (
        <p className="text-[9px]  xl:text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
};

export default PageHeader;
