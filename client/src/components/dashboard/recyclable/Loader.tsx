import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="relative">
        <div className="w-16 h-16 bg-primary-blue rounded-full animate-ping"></div>
        <div className="absolute top-0 left-0 w-16 h-16 bg-primary-blue rounded-full opacity-75"></div>
      </div>
    </div>
  );
};

export default Loader;