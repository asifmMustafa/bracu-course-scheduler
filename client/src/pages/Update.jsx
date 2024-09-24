import React, { useState } from "react";
import axios from "axios";

const Update = () => {
  const [file, setFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) {
      setStatusMessage("Please select a file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    axios
      .post(`http://localhost:8000/api/update-database`, formData)
      .then((response) => {
        setStatusMessage("Database updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating database:", error);
        setStatusMessage("Error updating database.");
      });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Update Database</h1>
      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <label className="block text-gray-700">Upload PDF Schedule:</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Upload
        </button>
      </form>
      {statusMessage && <p className="mt-4 text-red-500">{statusMessage}</p>}
    </div>
  );
};

export default Update;
