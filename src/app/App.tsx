import React, { useState } from "react";
import type { SubCategoryId } from "./types/moit";
import ChatScreen from "./components/features/chat/ChatScreen";
import MainStartScreen from "./components/features/start/MainStartScreen";

export default function App() {
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<SubCategoryId | null>(null);
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
        {selectedSubCategoryId ? (
          <ChatScreen subCategoryId={selectedSubCategoryId} onBack={() => setSelectedSubCategoryId(null)} />
        ) : (
          <MainStartScreen
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode((value) => !value)}
            onSelectSubCategory={(item) => setSelectedSubCategoryId(item.id)}
          />
        )}
      </div>
    </>
  );
}
