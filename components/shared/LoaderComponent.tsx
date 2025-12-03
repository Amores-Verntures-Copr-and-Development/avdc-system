import React from "react";
interface LoaderComponentProps {
  title?: string;
}
const LoaderComponent = ({ title }: LoaderComponentProps) => {
  return (
    <div className="flex items-center justify-center h-screen">
      {title && <span>{title}</span>}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

export default LoaderComponent;
