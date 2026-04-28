namespace TaskManagement.API.Models
{
    public class Project
    {
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Not Started";
        public string Priority { get; set; } = "Medium";

        // Enterprise fields
        public int ProgrammeId { get; set; }
        public Programme? Programme { get; set; }

        // Critical path scheduling: calculated end date based on child tasks
        public DateTime? CalculatedEndDate { get; set; }

        public ICollection<TaskItem>? Tasks { get; set; }
    }
}