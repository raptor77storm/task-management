using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using System.Security.Claims;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Models.Auth;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordService _passwordService;
        private readonly ITokenService _tokenService;
        private readonly IAuditService _auditService;

        public AuthController(AppDbContext context, IPasswordService passwordService, ITokenService tokenService, IAuditService auditService)
        {
            _context = context;
            _passwordService = passwordService;
            _tokenService = tokenService;
            _auditService = auditService;
        }

        /// <summary>
        /// Login with username and password
        /// Returns JWT token and user info
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new LoginResponse { Success = false, Message = "Invalid request" });

            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new LoginResponse { Success = false, Message = "Username and password are required" });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

            if (user == null || !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
                return Unauthorized(new LoginResponse { Success = false, Message = "Invalid username or password" });

            var mustChangePassword = user.MustChangePasswordOnFirstLogin;

            // Enforce password change for first-time logins
            if (!mustChangePassword && !user.IsAdmin && user.LastLoginAt == null)
            {
                user.MustChangePasswordOnFirstLogin = true;
                mustChangePassword = true;
            }

            // Update last login timestamp
            user.LastLoginAt = DateTime.UtcNow;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Log the login
            await _auditService.LogAsync(user.UserNumber, "LOGIN", "User", user.UserNumber, 
                description: $"{user.FullName} logged in");

            var token = _tokenService.GenerateToken(user);
            var userDto = MapToUserDto(user);

            return Ok(new LoginResponse
            {
                Success = true,
                Token = token,
                User = userDto,
                MustChangePassword = mustChangePassword
            });
        }

        /// <summary>
        /// Get current logged-in user info
        /// Requires authentication
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound();

            return Ok(MapToUserDto(user));
        }

        [HttpPut("me/email")]
        [Authorize]
        public async Task<ActionResult<UserDto>> UpdateCurrentUserEmail([FromBody] UpdateEmailRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized();

            var email = request.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { message = "Email is required" });

            if (!IsValidEmail(email))
                return BadRequest(new { message = "Enter a valid email address" });

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound();

            user.Email = email;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(user.UserNumber, "UPDATE_EMAIL", "User", user.UserNumber,
                description: $"{user.FullName} updated their email address");

            return Ok(MapToUserDto(user));
        }

        /// <summary>
        /// Change password (for first-time setup or password reset)
        /// Requires authentication
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult<LoginResponse>> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new LoginResponse { Success = false, Message = "Invalid request" });

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound();

            // Verify current password (skip for first-time password setup)
            if (!user.MustChangePasswordOnFirstLogin)
            {
                if (!_passwordService.VerifyPassword(request.CurrentPassword, user.PasswordHash))
                    return BadRequest(new LoginResponse { Success = false, Message = "Current password is incorrect" });
            }

            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(new LoginResponse { Success = false, Message = "Passwords do not match" });

            if (request.NewPassword.Length < 6)
                return BadRequest(new LoginResponse { Success = false, Message = "Password must be at least 6 characters" });

            // Update password
            user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
            user.MustChangePasswordOnFirstLogin = false;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerateToken(user);
            var userDto = MapToUserDto(user);

            return Ok(new LoginResponse
            {
                Success = true,
                Token = token,
                User = userDto,
                Message = "Password changed successfully"
            });
        }

        /// <summary>
        /// Logout (frontend typically just clears token)
        /// This endpoint exists for audit logging if needed
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public IActionResult Logout()
        {
            // In a stateless JWT system, logout is handled on the client
            // No action needed on server, just return OK
            return Ok();
        }

        /// <summary>
        /// Admin: Reset user password and force password change on next login
        /// Requires Admin role
        /// </summary>
        [HttpPost("admin/reset-password/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LoginResponse>> AdminResetPassword(int userId)
        {
            var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
                return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new LoginResponse { Success = false, Message = "User not found" });

            // Generate temporary password
            string tempPassword = GenerateTemporaryPassword();

            user.PasswordHash = _passwordService.HashPassword(tempPassword);
            user.MustChangePasswordOnFirstLogin = true;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            // Log the action
            await _auditService.LogAsync(adminId, "RESET_PASSWORD", "User", userId, 
                description: $"Admin reset password for {user.FullName}");

            return Ok(new LoginResponse
            {
                Success = true,
                Message = $"Password reset. Temporary password: {tempPassword}",
                User = MapToUserDto(user)
            });
        }

        private string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
            var random = new Random();
            return new string(Enumerable.Range(0, 12).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }

        private static bool IsValidEmail(string email)
        {
            try
            {
                var address = new MailAddress(email);
                return address.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserNumber = user.UserNumber,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                Username = user.Username,
                Email = user.Email,
                IsAdmin = user.IsAdmin
            };
        }
    }

    public class UpdateEmailRequest
    {
        public string? Email { get; set; }
    }
}
