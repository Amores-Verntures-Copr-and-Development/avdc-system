import { PDFViewer } from "@react-pdf/renderer";
import React from "react";

const PDFReview = () => {
  return (
    <div className="w-full h-screen">
      <PDFViewer width="100%" height="100%">
        {/* <RequestOrderPDF /> */}
      </PDFViewer>
    </div>
  );
};

export default PDFReview;
