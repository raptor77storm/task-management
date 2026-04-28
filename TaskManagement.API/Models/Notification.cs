using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TaskManagement.API.Models
{
    /// <summary>
    /// Notification template for consistent email messages
    /// </summary>
    public class NotificationTemplate
    {
        [Key]
        public int TemplateId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } // e.g., "TaskAssigned", "TaskCompleted", "TaskDue"

        [Required]
        [StringLength(200)]
        public string Subject { get; set; } // Email subject line

        [Required]
        public string BodyTemplate { get; set; } // HTML email body with {{placeholders}}

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }

    /// <summary>
    /// Notification delivery history and status
    /// </summary>
    public class NotificationLog
    {
        [Key]
        public int LogId { get; set; }

        [Required]
        public int RecipientUserId { get; set; }

        [ForeignKey(nameof(RecipientUserId))]
        public User RecipientUser { get; set; }

        public int? RelatedTaskId { get; set; }

        [ForeignKey(nameof(RelatedTaskId))]
        public TaskItem RelatedTask { get; set; }

        [Required]
        public int TemplateId { get; set; }

        [ForeignKey(nameof(TemplateId))]
        public NotificationTemplate Template { get; set; }

        [Required]
        [StringLength(255)]
        public string Subject { get; set; }

        [Required]
        public string Body { get; set; }

        [Required]
        [StringLength(255)]
        public string RecipientEmail { get; set; }

        public string Status { get; set; } = "Pending"; // Pending, Sent, Failed, Bounced

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? SentAt { get; set; }

        public string ErrorMessage { get; set; }

        public int RetryCount { get; set; } = 0;

        public int MaxRetries { get; set; } = 3;
    }

    /// <summary>
    /// User notification preferences
    /// </summary>
    public class NotificationPreference
    {
        [Key]
        public int PreferenceId { get; set; }

        [Required]
        public int UserNumber { get; set; }

        [ForeignKey(nameof(UserNumber))]
        public User User { get; set; }

        public bool TaskAssignedEmail { get; set; } = true;

        public bool TaskCompletedEmail { get; set; } = true;

        public bool TaskDueSoonEmail { get; set; } = true; // Due in 2 days or less

        public bool TaskStatusChangeEmail { get; set; } = true;

        public bool DailyDigestEmail { get; set; } = false;

        public string DigestTime { get; set; } = "09:00"; // HH:mm format

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
