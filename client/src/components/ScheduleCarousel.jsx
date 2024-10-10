import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ScheduleDisplay from "./ScheduleDisplay";
import { Carousel } from "react-responsive-carousel";
import "../styles/carousel.min.css";

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9 13.5 3 3m0 0 3-3m-3 3v-6m1.06-4.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
    />
  </svg>
);

const ScheduleCarousel = ({ schedules }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scheduleRefs = useRef([]);

  const handleDownload = () => {
    const input = scheduleRefs.current[currentSlide];
    if (input) {
      const clone = input.cloneNode(true);

      clone.style.overflow = "visible";
      clone.style.width = "fit-content";

      clone.style.position = "fixed";
      clone.style.top = "-9999px";
      document.body.appendChild(clone);

      html2canvas(clone, { scale: 2 })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imgData;
          link.download = "schedule.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          document.body.removeChild(clone);
        })
        .catch((err) => {
          console.error("Error generating image:", err);
          document.body.removeChild(clone);
        });
    } else {
      console.error("No schedule to download.");
    }
  };

  return (
    <div className="mt-5">
      <Carousel
        selectedItem={currentSlide}
        onChange={(index) => setCurrentSlide(index)}
        showThumbs={false}
        infiniteLoop
        useKeyboardArrows
      >
        {schedules.map((schedule, index) => (
          <ScheduleDisplay
            schedule={schedule}
            ref={(el) => (scheduleRefs.current[index] = el)}
          />
        ))}
      </Carousel>
      <div className="flex justify-center mt-4 mb-10 space-x-4">
        <button
          onClick={() =>
            setCurrentSlide((prevSlide) =>
              prevSlide === 0 ? schedules.length - 1 : prevSlide - 1
            )
          }
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Prev
        </button>
        <button
          onClick={handleDownload}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          <DownloadIcon />
        </button>
        <button
          onClick={() =>
            setCurrentSlide((prevSlide) => (prevSlide + 1) % schedules.length)
          }
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ScheduleCarousel;
