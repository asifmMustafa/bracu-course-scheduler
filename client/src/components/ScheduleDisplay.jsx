import React from "react";

const ScheduleDisplay = ({ schedule }) => {
  console.log("Received Schedule:", schedule);

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Define fixed time slots
  const timeSlots = [
    "08:00 AM - 09:20 AM",
    "09:30 AM - 10:50 AM",
    "11:00 AM - 12:20 PM",
    "12:30 PM - 01:50 PM",
    "02:00 PM - 03:20 PM",
    "03:30 PM - 04:50 PM",
  ];

  // Create an array of time slot objects
  const timeSlotObjects = timeSlots.map((slot) => {
    const [start, end] = slot.split(" - ");
    return { slot, start, end };
  });

  // Initialize scheduleMap with fixed time slots and days of the week
  const scheduleMap = {};
  timeSlots.forEach((slot) => {
    scheduleMap[slot] = {};
    daysOfWeek.forEach((day) => {
      scheduleMap[slot][day] = null;
    });
  });

  // Populate the scheduleMap with class session details
  schedule.forEach((section) => {
    section.classes.forEach((classSession) => {
      const { day, start_time, end_time, room } = classSession;
      const { course_code, faculty, section_number } = section;

      // Find the matching time slot for this class session
      const matchingSlot = timeSlotObjects.find(
        (slotObj) => slotObj.start === start_time && slotObj.end === end_time
      );

      if (matchingSlot) {
        const slotKey = matchingSlot.slot;
        if (scheduleMap[slotKey] && scheduleMap[slotKey][day] === null) {
          scheduleMap[slotKey][day] = {
            course_code,
            faculty,
            section_number,
            room,
          };
        }
      }
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2 bg-gray-200">Time</th>
            {daysOfWeek.map((day) => (
              <th key={day} className="border px-4 py-2 bg-gray-200">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time, index) => (
            <tr key={index} className="text-center">
              <td className="border px-4 py-2">{time}</td>
              {daysOfWeek.map((day) => (
                <td key={day} className="border px-4 py-2">
                  {scheduleMap[time][day] ? (
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {scheduleMap[time][day].course_code} (Sec{" "}
                        {scheduleMap[time][day].section_number})
                      </span>
                      <span>{scheduleMap[time][day].faculty}</span>
                      <span className="text-sm text-gray-600">
                        Room: {scheduleMap[time][day].room}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleDisplay;
