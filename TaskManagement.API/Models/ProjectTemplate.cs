using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagement.API.Models
{
    /// <summary>
    /// Template for quick project creation with predefined tasks and structure.
    /// Allows organizations to standardize project creation and reduce setup time.
    /// </summary>
    public class ProjectTemplate
    {
        [Key]
        public int TemplateId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } // e.g., "Software Development", "Marketing Campaign", "IT Infrastructure"

        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        public int CreatedByUserId { get; set; }

        [ForeignKey(nameof(CreatedByUserId))]
        public User CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Is this template available to all organizations or just the creator's org?
        /// </summary>
        public bool IsPublic { get; set; } = false;

        /// <summary>
        /// Number of times this template has been used
        /// </summary>
        public int UsageCount { get; set; } = 0;

        /// <summary>
        /// Predefined tasks included when creating a project from this template
        /// </summary>
        public ICollection<TemplateTask> TemplateTasks { get; set; } = new List<TemplateTask>();
    }

    /// <summary>
    /// Predefined task blueprint that becomes a real task when project is created from template.
    /// </summary>
    public class TemplateTask
    {
        [Key]
        public int TemplateTaskId { get; set; }

        public int TemplateId { get; set; }

        [ForeignKey(nameof(TemplateId))]
        public ProjectTemplate ProjectTemplate { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        /// <summary>
        /// Relative order of tasks in template (for sequencing)
        /// </summary>
        public int OrderIndex { get; set; }

        /// <summary>
        /// Days offset from project start date
        /// </summary>
        public int StartDateOffsetDays { get; set; } = 0;

        /// <summary>
        /// Days offset from project start date
        /// </summary>
        public int DurationDays { get; set; } = 5;

        public string Priority { get; set; } = "Medium"; // Low, Medium, High

        public string Status { get; set; } = "Not Started";

        /// <summary>
        /// ID of predecessor task in template (for task dependencies)
        /// </summary>
        public int? PredecessorTemplateTaskId { get; set; }

        [ForeignKey(nameof(PredecessorTemplateTaskId))]
        public TemplateTask PredecessorTemplateTask { get; set; }
    }
}
