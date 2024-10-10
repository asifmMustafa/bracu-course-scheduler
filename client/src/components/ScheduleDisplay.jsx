import React from "react";

const ScheduleDisplay = React.forwardRef(({ schedule }, ref) => {
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeSlots = [
    "08:00 AM - 09:20 AM",
    "09:30 AM - 10:50 AM",
    "11:00 AM - 12:20 PM",
    "12:30 PM - 01:50 PM",
    "02:00 PM - 03:20 PM",
    "03:30 PM - 04:50 PM",
  ];

  const timeSlotObjects = timeSlots.map((slot) => {
    const [start, end] = slot.split(" - ");
    return { slot, start, end };
  });

  const scheduleMap = {};
  timeSlots.forEach((slot) => {
    scheduleMap[slot] = {};
    daysOfWeek.forEach((day) => {
      scheduleMap[slot][day] = null;
    });
  });

  schedule.forEach((section) => {
    section.classes.forEach((classSession) => {
      const { day, start_time, end_time, room } = classSession;
      const { course_code, faculty, section_number } = section;

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
    <div ref={ref}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse table-fixed">
          <thead>
            <tr>
              <th className="border px-4 py-2 bg-gray-200 w-32">Time</th>
              {daysOfWeek.map((day) => (
                <th key={day} className="border px-4 py-2 bg-gray-200 w-32">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, index) => (
              <tr key={index} className="text-center">
                <td className="border px-4 py-2 h-24">
                  <div className="flex items-center justify-center h-full">
                    {time}
                  </div>
                </td>
                {daysOfWeek.map((day) => (
                  <td key={day} className="border px-4 py-2 h-24">
                    {scheduleMap[time][day] ? (
                      <div className="flex flex-col items-center justify-center h-full text-sm">
                        <span className="font-semibold">
                          {scheduleMap[time][day].course_code}
                        </span>
                        <span>Sec {scheduleMap[time][day].section_number}</span>
                        <span>{scheduleMap[time][day].faculty}</span>
                        <span className="text-sm text-gray-600">
                          Room: {scheduleMap[time][day].room}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ScheduleDisplay;
