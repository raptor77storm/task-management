namespace TaskManagement.API.Models
{
    public class User
    {
        public int UserNumber { get; set; }
        public string SSN { get; set; } = string.Empty; // External key attribute for identity verification
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? MiddleInitial { get; set; }
        public string Roles { get; set; } = string.Empty; // Comma-separated multivalued attribute

        // Authentication & Authorization
        public string Username { get; set; } = string.Empty; // Login credentials
        public string PasswordHash { get; set; } = string.Empty; // Hashed password (PBKDF2)
        public bool IsAdmin { get; set; } = false; // Role: Admin vs TeamMember
        public bool IsActive { get; set; } = true; // Account status
        public DateTime? LastLoginAt { get; set; } // Track login history
        public bool MustChangePasswordOnFirstLogin { get; set; } = true; // Force password change

        public string? Email { get; set; }
        public int? TeamTypeId { get; set; }
        public TeamType? TeamType { get; set; }

        public string FullName => $"{FirstName} {MiddleInitial} {LastName}".Trim();

        public ICollection<ResourceAllocation>? Allocations { get; set; }
        public ICollection<TimesheetEntry>? TimesheetEntries { get; set; }
    }
}
