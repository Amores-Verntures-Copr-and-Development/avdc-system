import React from "react";
interface PageLayoutProps {
  children: React.ReactNode;
}
const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-dvh w-full bg-gradient-to-br gap-5 overflow-hidden">
      {children}
    </div>
  );
};

export default PageLayout;
