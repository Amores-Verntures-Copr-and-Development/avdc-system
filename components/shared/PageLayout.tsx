import React from "react";
interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}
const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  className = "gap-5",
}) => {
  return (
    <div
      id="#container"
      className={`flex flex-col h-dvh w-full bg-gradient-to-br overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export default PageLayout;
