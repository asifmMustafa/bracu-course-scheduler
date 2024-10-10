import React, { useState, useEffect, useRef } from "react";
import { SearchIcon } from "@heroicons/react/solid";

const SearchBar = ({ courseOptions, selectedCourses, handleSelectCourse }) => {
  const [inputValue, setInputValue] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const wrapperRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim() === "") {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    } else {
      const filtered = courseOptions.filter(
        (option) =>
          option.label.toLowerCase().startsWith(value.toLowerCase()) &&
          !selectedCourses.some((selected) => selected === option.label)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
    setActiveSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    if (!selectedCourses.some((selected) => selected === suggestion.label)) {
      handleSelectCourse(suggestion.value);
    }
    setInputValue("");
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (activeSuggestionIndex < filteredSuggestions.length - 1) {
        setActiveSuggestionIndex(activeSuggestionIndex + 1);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (activeSuggestionIndex > 0) {
        setActiveSuggestionIndex(activeSuggestionIndex - 1);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < filteredSuggestions.length
      ) {
        handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full pt-2 pb-4 md:pb-6 md:pt-2 border-b-2 border-gray-100"
    >
      {/* Search Input */}
      <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 bg-white shadow-inner">
        <input
          type="text"
          className="flex-grow outline-none text-gray-700"
          placeholder="Search for courses"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => {
            if (filteredSuggestions.length > 0) setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <SearchIcon className="h-5 w-5 text-gray-500" />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-l-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion.value}
              className={`px-4 py-2 cursor-pointer ${
                index === activeSuggestionIndex
                  ? "bg-gray-100"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}

      {/* No Suggestions Found */}
      {showSuggestions && filteredSuggestions.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 px-4 py-2 shadow-lg">
          No courses found.
        </div>
      )}
    </div>
  );
};

export default SearchBar;
