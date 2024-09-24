import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Carousel } from "react-responsive-carousel";
import "../styles/carousel.min.css";
import ScheduleDisplay from "../components/ScheduleDisplay";

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [faculties, setFaculties] = useState({});
  const [preferences, setPreferences] = useState({
    facultyPreferences: {},
    unavailableDays: [],
  });
  const [availableDays] = useState([
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);
  const [schedules, setSchedules] = useState([]);
  const [showCarousel, setShowCarousel] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/courses")
      .then((response) => {
        setCourses(response.data);
        const options = response.data.map((course) => ({
          value: course.code,
          label: course.code,
        }));
        setCourseOptions(options);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
      });
  }, []);

  const handleCourseChange = (selectedOptions) => {
    const selected = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setSelectedCourses(selected);

    selected.forEach((course) => {
      if (!faculties[course]) {
        axios
          .get(`http://localhost:8000/api/courses/${course}/faculties`)
          .then((response) => {
            setFaculties((prev) => ({ ...prev, [course]: response.data }));
          })
          .catch((error) => {
            console.error(
              `Error fetching faculties for course ${course}:`,
              error
            );
          });
      }
    });
  };

  const handleFacultyPreferenceChange = (course, faculty) => {
    setPreferences((prev) => ({
      ...prev,
      facultyPreferences: {
        ...prev.facultyPreferences,
        [course]: faculty,
      },
    }));
  };

  const handleUnavailableDaysChange = (day) => {
    setPreferences((prev) => {
      const days = prev.unavailableDays.includes(day)
        ? prev.unavailableDays.filter((d) => d !== day)
        : [...prev.unavailableDays, day];
      return { ...prev, unavailableDays: days };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      courses: selectedCourses,
      preferences: preferences.facultyPreferences,
      unavailable_days: preferences.unavailableDays,
    };
    axios
      .post("http://localhost:8000/api/schedules", data)
      .then((response) => {
        console.log("Received schedules:", response.data);
        setSchedules(response.data);
        setShowCarousel(true);
      })
      .catch((error) => {
        console.error("Error fetching schedules:", error);
      });
  };

  useEffect(() => {
    console.log(schedules);
  }, [schedules]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Course Scheduler</h1>
      {!showCarousel ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Select Courses:</label>
            <Select
              isMulti
              options={courseOptions}
              onChange={handleCourseChange}
              placeholder="Search and select courses..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>

          {selectedCourses.map((course) => (
            <div key={course} className="mb-4">
              <label className="block text-gray-700">
                Preferred Faculty for {course}:
              </label>
              <select
                className="w-full mt-1 p-2 border rounded"
                onChange={(e) =>
                  handleFacultyPreferenceChange(course, e.target.value)
                }
              >
                <option value="">No Preference</option>
                {faculties[course] &&
                  faculties[course].map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
              </select>
            </div>
          ))}

          <div className="mb-4">
            <label className="block text-gray-700">Days Unavailable:</label>
            <div className="flex flex-wrap mt-1">
              {availableDays.map((day) => (
                <label key={day} className="mr-4">
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={preferences.unavailableDays.includes(day)}
                    onChange={() => handleUnavailableDaysChange(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Get Schedules
          </button>
        </form>
      ) : (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">
            Possible Schedules ({schedules.length})
          </h2>
          {schedules.length === 0 ? (
            <p className="text-red-500">
              No possible schedules found. Please adjust your preferences.
            </p>
          ) : (
            <Carousel showThumbs={false} infiniteLoop useKeyboardArrows>
              {schedules.map((schedule, index) => (
                <div key={index}>
                  <ScheduleDisplay schedule={schedule} />
                </div>
              ))}
            </Carousel>
          )}
          <button
            onClick={() => {
              setShowCarousel(false);
              setSelectedCourses([]);
              setPreferences({
                facultyPreferences: {},
                unavailableDays: [],
              });
            }}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Back to Preferences
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
