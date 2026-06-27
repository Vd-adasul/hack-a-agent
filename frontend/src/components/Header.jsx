import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDateContext } from "../hooks/useDateContext.jsx";
import { shiftDate, getRelativeDateString } from "../utils/api";

export function Header({ user }) {
  const { activeDate, setActiveDate } = useDateContext();

  const handlePreviousDay = () => {
    setActiveDate(shiftDate(activeDate, -1));
  };

  const handleNextDay = () => {
    setActiveDate(shiftDate(activeDate, 1));
  };

  const handleToday = () => {
    setActiveDate(getRelativeDateString(0));
  };

  const dateObj = new Date(activeDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <header className="header">
      <div className="header-content">
        <div>
          <p className="header-greeting">Welcome{user ? `, ${user.name}` : ""}</p>
          <h1 className="header-title">{formattedDate}</h1>
        </div>
        <div className="header-controls">
          <button className="icon-button" onClick={handlePreviousDay} title="Previous day">
            <ChevronLeft size={20} />
          </button>
          <button className="text-button" onClick={handleToday}>
            Today
          </button>
          <button className="icon-button" onClick={handleNextDay} title="Next day">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
