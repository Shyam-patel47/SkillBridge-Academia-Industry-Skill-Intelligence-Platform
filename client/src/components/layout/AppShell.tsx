import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#080d1a] text-slate-100 selection:bg-sky-500 selection:text-white">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
