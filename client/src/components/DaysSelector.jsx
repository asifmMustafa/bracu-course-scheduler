import React from "react";
import Select from "react-select";

const DaysSelector = ({
  availableDays,
  unavailableDays,
  handleUnavailableDaysChange,
}) => {
  const options = availableDays.map((day) => ({
    value: day,
    label: day,
  }));

  const selectedOptions = unavailableDays.map((day) => ({
    value: day,
    label: day,
  }));

  const handleChange = (selected) => {
    const days = selected ? selected.map((option) => option.value) : [];
    handleUnavailableDaysChange(days);
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
    <div className="mt-4 pb-6 border-b-2 border-gray-100">
      <h2 className="mb-2 pl-1">Pick days with no classes:</h2>
      <Select
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        isMulti
        placeholder="Select days..."
        className="basic-multi-select"
        classNamePrefix="select"
        styles={customStyles}
      />
    </div>
  );
};

export default DaysSelector;
