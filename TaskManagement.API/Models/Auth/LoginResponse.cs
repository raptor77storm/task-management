namespace TaskManagement.API.Models.Auth
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public string? Token { get; set; } // JWT token
        public UserDto? User { get; set; }
        public string? Message { get; set; }
        public bool MustChangePassword { get; set; } // First-time login flag
    }

    public class UserDto
    {
        public int UserNumber { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public bool IsAdmin { get; set; }
    }
}
