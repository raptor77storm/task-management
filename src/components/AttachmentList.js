import React, { useEffect, useState } from "react";
import attachmentService from "../services/attachmentService";

function AttachmentList({ taskId, isAdmin, onDeleteSuccess }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await attachmentService.getTaskAttachments(taskId);
      setAttachments(data);
    } catch (err) {
      setError("Error loading attachments");
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachmentId, fileName) => {
    try {
      await attachmentService.downloadAttachment(attachmentId, fileName);
    } catch (err) {
      alert("Error downloading file");
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!window.confirm("Delete this attachment?")) return;

    try {
      await attachmentService.deleteAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.attachmentId !== attachmentId));
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      alert("Error deleting attachment");
    }
  };

  if (loading) {
    return <p style={{ color: "#999", fontSize: "12px" }}>Loading attachments...</p>;
  }

  if (error) {
    return <p style={{ color: "#dc3545", fontSize: "12px" }}>❌ {error}</p>;
  }

  if (attachments.length === 0) {
    return <p style={{ color: "#999", fontSize: "12px" }}>No attachments yet</p>;
  }

  return (
    <div style={{ marginTop: "15px" }}>
      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>
        📎 Attachments ({attachments.length})
      </h4>
      <div style={{ display: "grid", gap: "8px" }}>
        {attachments.map((attachment) => (
          <div
            key={attachment.attachmentId}
            style={{
              padding: "10px 12px",
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "16px" }}>
                  {attachmentService.getFileIcon(attachment.fileType)}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#0056b3",
                    cursor: "pointer",
                    textDecoration: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  onClick={() => handleDownload(attachment.attachmentId, attachment.fileName)}
                  title={attachment.fileName}
                >
                  {attachment.fileName}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#666", display: "flex", gap: "12px" }}>
                <span>{attachmentService.formatFileSize(attachment.fileSize)}</span>
                <span>
                  by {attachment.uploadedByUserName} on{" "}
                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => handleDownload(attachment.attachmentId, attachment.fileName)}
                style={{
                  padding: "4px 8px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "600",
                }}
              >
                ⬇️ Download
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDelete(attachment.attachmentId)}
                  style={{
                    padding: "4px 8px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttachmentList;
