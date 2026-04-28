namespace TaskManagement.API.Models
{
    public class AuditLog
    {
        public int AuditLogId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // Created, Updated, Deleted, Login, PasswordChanged
        public string EntityType { get; set; } = string.Empty; // Project, Task, User, etc.
        public int? EntityId { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? IpAddress { get; set; }
        public string? Description { get; set; }

        public User? User { get; set; }
    }
}
