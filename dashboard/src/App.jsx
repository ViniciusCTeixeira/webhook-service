import React, { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { InspectorPage } from "./pages/InspectorPage";
import { SessionsPage } from "./pages/SessionsPage";
import { TesterPage } from "./pages/TesterPage";
import { SystemPage } from "./pages/SystemPage";

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState("inspector");

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "inspector" && <InspectorPage />}
            {activeTab === "sessions" && <SessionsPage />}
            {activeTab === "tester" && <TesterPage />}
            {activeTab === "system" && <SystemPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
};

export default App;
