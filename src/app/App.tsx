import React from "react";
import ChatLayout from "./components/ChatLayout";

export default function App() {
  return (
    <>
      <style>{`
        /* Hide default scrollbars for a clean workspace feel */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(26, 58, 92, 0.1);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(26, 58, 92, 0.2);
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #F2F6FC;
        }
      `}</style>
      <div className="w-screen h-screen overflow-hidden">
        <ChatLayout />
      </div>
    </>
  );
}
