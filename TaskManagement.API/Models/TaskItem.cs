namespace TaskManagement.API.Models
{
    public class TaskItem
    {
        public int TaskItemId { get; set; }

        public int ProjectId { get; set; }
        public Project? Project { get; set; }

        public int? ParentTaskId { get; set; }
        public TaskItem? ParentTask { get; set; }

        public int? AssignedToUserId { get; set; }
        public User? AssignedToUser { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Not Started";
        public string Priority { get; set; } = "Medium";
        public int? TaskTypeId { get; set; }
        public TaskType? TaskType { get; set; }

        // Enterprise fields
        public decimal OverheadCosts { get; set; } = 0; // OH
        public int? PredecessorTaskId { get; set; } // For task precedence/dependencies
        public TaskItem? PredecessorTask { get; set; } // Navigation property for predecessor
        public decimal BudgetAtCompletion { get; set; } = 0; // BAC

        public ICollection<TaskItem>? SubTasks { get; set; }
        public ICollection<TaskItem>? DependentTasks { get; set; } // Tasks that depend on this one
        public ICollection<Requirement>? Requirements { get; set; }
        public ICollection<Attachment>? Attachments { get; set; }
        public ICollection<Progress>? ProgressSnapshots { get; set; }
        public ICollection<TimesheetEntry>? TimesheetEntries { get; set; }

        // Temporal fields for performance tracking
        public decimal PlannedWorkPercentage { get; set; } = 0;
    }
}
