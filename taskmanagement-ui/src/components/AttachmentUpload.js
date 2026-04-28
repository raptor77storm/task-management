import React, { useState, useRef } from "react";
import attachmentService from "../services/attachmentService";

function AttachmentUpload({ taskId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    setError("");

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit");
      return;
    }

    try {
      setUploading(true);
      const result = await attachmentService.uploadAttachment(taskId, file);
      setUploading(false);
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Notify parent
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.message || "Error uploading file");
      console.error("Upload error:", err);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        border: dragActive ? "2px dashed #007bff" : "2px dashed #ddd",
        borderRadius: "6px",
        padding: "20px",
        textAlign: "center",
        background: dragActive ? "#f0f7ff" : "#fafafa",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        disabled={uploading}
        style={{ display: "none" }}
      />
      
      {uploading ? (
        <div>
          <p style={{ margin: "10px 0", color: "#666", fontSize: "14px" }}>
            📤 Uploading...
          </p>
        </div>
      ) : (
        <div>
          <p style={{ margin: "0 0 8px 0", fontSize: "24px" }}>📎</p>
          <p style={{ margin: "0 0 4px 0", color: "#333", fontSize: "14px", fontWeight: "600" }}>
            Drag & drop a file here
          </p>
          <p style={{ margin: "0", color: "#999", fontSize: "12px" }}>
            or click to browse (Max 50MB)
          </p>
        </div>
      )}

      {error && (
        <p style={{ margin: "10px 0 0 0", color: "#dc3545", fontSize: "12px" }}>
          ❌ {error}
        </p>
      )}
    </div>
  );
}

export default AttachmentUpload;
