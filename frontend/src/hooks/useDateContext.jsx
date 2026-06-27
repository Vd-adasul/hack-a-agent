import React, { createContext, useContext, useState } from "react";
import { getLocalDateString } from "../utils/api";

const DateContext = createContext();

export function DateProvider({ children }) {
  const [activeDate, setActiveDate] = useState(getLocalDateString());

  return (
    <DateContext.Provider value={{ activeDate, setActiveDate }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error("useDateContext must be used within DateProvider");
  }
  return context;
}
