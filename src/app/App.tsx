import React, { useState } from "react";
import type { DiagnosisItem } from "./data";
import ChatScreen from "./components/ChatScreen";
import MainStartScreen from "./components/MainStartScreen";

export default function App() {
  const [selectedItem, setSelectedItem] = useState<DiagnosisItem | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <>
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(26, 58, 92, 0.16);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(26, 58, 92, 0.26);
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #F2F6FC;
        }
      `}</style>
      <div className={isDarkMode ? "dark" : ""}>
        {selectedItem ? (
          <ChatScreen item={selectedItem} onBack={() => setSelectedItem(null)} />
        ) : (
          <MainStartScreen
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((value) => !value)}
            onSelectItem={setSelectedItem}
          />
        )}
      </div>
    </>
  );
}
