namespace TaskManagement.API.Models
{
    /// <summary>
    /// Weak Entity: Attachment
    /// Depends on Task - cannot exist without a parent task
    /// </summary>
    public class Attachment
    {
        public int AttachmentId { get; set; }
        public int TaskId { get; set; }
        public TaskItem? Task { get; set; }

        public string FileName { get; set; } = string.Empty; // Original file name
        public string FilePath { get; set; } = string.Empty; // Stored file path on server
        public string FileType { get; set; } = string.Empty; // MIME type (e.g., application/pdf)
        public long FileSize { get; set; } = 0; // Size in bytes

        public int? UploadedByUserId { get; set; } // Who uploaded
        public User? UploadedByUser { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow; // When uploaded
    }
}
