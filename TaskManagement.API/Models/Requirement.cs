namespace TaskManagement.API.Models
{
    /// <summary>
    /// Association Class: Task Requirements
    /// Maps resources required for a specific Task
    /// </summary>
    public class Requirement
    {
        public int TaskId { get; set; }
        public TaskItem? Task { get; set; }

        public int ResourceId { get; set; }
        public Resource? Resource { get; set; }

        public decimal TotalRequirement { get; set; }
    }
}
