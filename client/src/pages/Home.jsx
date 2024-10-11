import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import CourseCard from "../components/CourseCard";
import DaysSelector from "../components/DaysSelector";
import ScheduleCarousel from "../components/ScheduleCarousel";
import LoadingSplnner from "../components/LoadingSplnner";

const Home = () => {
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [faculties, setFaculties] = useState({});
  const [schedules, setSchedules] = useState([[]]);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    faculties: {},
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

  const handleSelectCourse = (course) => {
    const selected = [...selectedCourses, course];
    setSelectedCourses(selected);

    selected.forEach((course) => {
      if (!faculties[course]) {
        axios
          .get(
            `${
              import.meta.env.VITE_SERVER_BASE_URL
            }/api/courses/${course}/faculties`
          )
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

  const handleRemoveSelectedCourse = (course) => {
    setPreferences((prevPreferences) => {
      const { [course]: _, ...updatedFaculties } = prevPreferences.faculties;
      return {
        ...prevPreferences,
        faculties: updatedFaculties,
      };
    });

    setSelectedCourses((prevCourses) =>
      prevCourses.filter((c) => c !== course)
    );
  };

  const handleFacultyPreferenceChange = (course, faculty) => {
    setPreferences((prev) => ({
      ...prev,
      faculties: {
        ...prev.faculties,
        [course]: faculty,
      },
    }));
  };

  const handleUnavailableDaysChange = (days) => {
    setPreferences((prev) => ({
      ...prev,
      unavailableDays: days,
    }));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    const data = {
      courses: selectedCourses,
      preferences: preferences.faculties,
      unavailable_days: preferences.unavailableDays,
    };
    axios
      .post(`${import.meta.env.VITE_SERVER_BASE_URL}/api/schedules`, data)
      .then((response) => {
        setSchedules(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error fetching schedules:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_SERVER_BASE_URL}/api/courses`)
      .then((response) => {
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

  return (
    <div className="bg-white w-full flex-grow p-5 poppins-light text-xs md:text-sm">
      <div className="flex flex-row justify-between border-b-2 border-gray-100 mb-2 pb-2">
        <h1 className="text-xl md:text-2xl mx-auto md:mx-0 font-bold">
          BracU Course Scheduler
        </h1>
        <button
          onClick={() => handleSubmit()}
          className={`hidden md:flex bg-blue-600 hover:bg-blue-500 px-4 py-2 font-medium rounded-md items-center justify-center text-white ${
            isLoading ? "cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          Get Schedules
          {isLoading ? <LoadingSplnner /> : null}
        </button>
      </div>
      <div className="w-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 flex flex-col">
          <SearchBar
            courseOptions={courseOptions}
            selectedCourses={selectedCourses}
            handleSelectCourse={handleSelectCourse}
          />
          <DaysSelector
            availableDays={availableDays}
            unavailableDays={preferences.unavailableDays}
            handleUnavailableDaysChange={handleUnavailableDaysChange}
          />
          <button
            onClick={() => handleSubmit()}
            className={`flex md:hidden bg-blue-600 px-4 py-3 mb-8 font-medium rounded-md items-center justify-center text-white ${
              isLoading ? "cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            Get Schedules
            {isLoading ? <LoadingSplnner /> : null}
          </button>
          {selectedCourses.length > 0 && (
            <span className="mt-4 font-light text-sm">Selected courses:</span>
          )}
          {selectedCourses.map((course) => (
            <CourseCard
              key={course}
              course={course}
              faculties={faculties[course]}
              selectedFaculty={preferences.faculties[course]}
              handleFacultyPreferenceChange={handleFacultyPreferenceChange}
              handleRemoveSelectedCourse={handleRemoveSelectedCourse}
            />
          ))}
        </div>
        <div className="w-full md:w-3/4 px-0 md:px-16">
          <ScheduleCarousel schedules={schedules} />
        </div>
      </div>
    </div>
  );
};

export default Home;
