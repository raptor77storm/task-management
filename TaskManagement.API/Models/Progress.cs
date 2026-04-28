namespace TaskManagement.API.Models
{
    /// <summary>
    /// Progress: Temporal snapshot for performance tracking
    /// Stores work performed at specific snapshots in time
    /// </summary>
    public class Progress
    {
        public int ProgressId { get; set; }
        public int TaskId { get; set; }
        public TaskItem? Task { get; set; }

        public DateTime SnapshotDate { get; set; }
        public decimal tWP { get; set; } // Temporal Work Performed (%)
        public decimal cWP { get; set; } // Cost of Work Performed

        public bool IsAuthorized { get; set; } = false; // Immutable once authorized
    }
}
