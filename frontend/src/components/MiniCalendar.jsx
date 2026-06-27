import React, { useState } from "react";
import { useDateContext } from "../hooks/useDateContext.jsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MiniCalendar() {
  const { activeDate, setActiveDate } = useDateContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateClick = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().slice(0, 10);
    setActiveDate(dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button onClick={handlePrevMonth} className="icon-button">
          <ChevronLeft size={16} />
        </button>
        <h3>{monthName}</h3>
        <button onClick={handleNextMonth} className="icon-button">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mini-calendar-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="mini-calendar-days">
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;

          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
          const dateStr = date.toISOString().slice(0, 10);
          const isActive = dateStr === activeDate;
          const isToday = dateStr === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={day}
              className={`calendar-day ${isActive ? "active" : ""} ${isToday ? "today" : ""}`}
              onClick={() => handleDateClick(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
