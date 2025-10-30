import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import { PurchaseOrderPDF } from "./PurchaseOrderPDF";
import RequestOrderPDF from "./RequestOrderPDF";

const PDFReview = () => {
  const sampleData = {
    logo: "/your-logo.png",
    companyName: "Rocket Systems Inc.",
    companyAddress: "123 Main Street, Manila, PH",
    companyContact: "(02) 1234-5678",
    orderType: "Purchase Order",
    poNumber: "PO-000123",
    date: "2025-10-30",
    supplierName: "Boduo Trading Co.",
    supplierAddress: "Makati City, PH",
    items: [
      { description: "Assam Black Tea", quantity: 10, price: 15 },
      { description: "Green Tea", quantity: 5, price: 12 },
    ],
  };
  return (
    <div className="w-full h-screen">
      <PDFViewer width="100%" height="100%">
        {/* <RequestOrderPDF /> */}
      </PDFViewer>
    </div>
  );
};

export default PDFReview;
