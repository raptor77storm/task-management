import api from "./api";

const attachmentService = {
  // Get all attachments for a task
  getTaskAttachments: async (taskId) => {
    try {
      const response = await api.get(`/Attachments/Task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching attachments:", error);
      throw error;
    }
  },

  // Upload a file attachment
  uploadAttachment: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(`/Attachments?taskId=${taskId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading attachment:", error);
      throw error;
    }
  },

  // Download a file attachment
  downloadAttachment: async (attachmentId, fileName) => {
    try {
      const response = await api.get(`/Attachments/${attachmentId}/Download`, {
        responseType: "blob",
      });

      // Create blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      throw error;
    }
  },

  // Delete an attachment
  deleteAttachment: async (attachmentId) => {
    try {
      await api.delete(`/Attachments/${attachmentId}`);
    } catch (error) {
      console.error("Error deleting attachment:", error);
      throw error;
    }
  },

  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  },

  // Get file icon based on MIME type
  getFileIcon: (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "🎯";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    if (fileType === "text/plain") return "📋";
    return "📎";
  },
};

export default attachmentService;
