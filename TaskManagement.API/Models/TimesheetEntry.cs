namespace TaskManagement.API.Models
{
    public class TimesheetEntry
    {
        public int TimesheetEntryId { get; set; }

        public int TaskId { get; set; }
        public TaskItem? Task { get; set; }

        public int UserNumber { get; set; }
        public User? User { get; set; }

        public DateTime WorkDate { get; set; }
        public decimal Hours { get; set; }
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
