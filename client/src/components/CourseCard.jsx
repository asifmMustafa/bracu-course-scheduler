import React from "react";
import { XIcon } from "@heroicons/react/solid";
import Select from "react-select";

const CourseCard = ({
  course,
  faculties,
  selectedFaculty,
  handleFacultyPreferenceChange,
  handleRemoveSelectedCourse,
}) => {
  const options = [
    { value: "", label: "Any professor" },
    ...(faculties
      ? faculties
          .slice()
          .sort()
          .map((faculty) => ({
            value: faculty,
            label: faculty,
          }))
      : []),
  ];

  const selectedOption = options.find(
    (option) => option.value === (selectedFaculty || "")
  );

  const handleChange = (selectedOption) => {
    handleFacultyPreferenceChange(course, selectedOption.value);
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#ccc" : provided.borderColor,
      boxShadow: "none",
      "&:hover": {
        borderColor: "#aaa",
        cursor: "pointer",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
    option: (provided) => ({
      ...provided,
      cursor: "pointer",
    }),
  };

  return (
    <div key={course} className="py-4 md:py-6 border-b-2 border-gray-100">
      <div className="flex flex-row justify-between mb-3 px-1">
        <span className="font-light text-md">{course}</span>
        <button
          onClick={() => handleRemoveSelectedCourse(course)}
          className="px-1 grid items-center bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          <XIcon className="w-4" />
        </button>
      </div>
      <Select
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder="Select professor..."
        styles={customStyles}
      />
    </div>
  );
};

export default CourseCard;
