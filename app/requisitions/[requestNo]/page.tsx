import React from "react";
import RequestNoPage from "./RequestNoPage";
export interface PageProps {
  params: { requestNo: string }; // Next.js injects this
}
const page = async ({ params }: PageProps) => {
  const { requestNo } = await params;
  return <RequestNoPage requestNo={requestNo} />;
};

export default page;
