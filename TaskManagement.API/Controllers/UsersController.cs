using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordService _passwordService;

        public UsersController(AppDbContext context, IPasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users
                .Include(u => u.TeamType)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<CreateUserResponse>> CreateUser(CreateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) && string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { message = "Username or email is required." });

            if (!request.TeamTypeId.HasValue || request.TeamTypeId.Value <= 0)
                return BadRequest(new { message = "Team type is required." });

            var username = string.IsNullOrWhiteSpace(request.Username)
                ? request.Email!.Trim()
                : request.Username.Trim();

            if (!string.IsNullOrWhiteSpace(request.Email) && !IsValidEmail(request.Email.Trim()))
                return BadRequest(new { message = "Enter a valid email address" });

            var tempPassword = GenerateTemporaryPassword();

            var user = new User
            {
                SSN = string.IsNullOrWhiteSpace(request.SSN) ? Guid.NewGuid().ToString("N").Substring(0, 9) : request.SSN.Trim(),
                FirstName = request.FirstName?.Trim() ?? string.Empty,
                LastName = request.LastName?.Trim() ?? string.Empty,
                MiddleInitial = string.IsNullOrWhiteSpace(request.MiddleInitial) ? null : request.MiddleInitial.Trim(),
                Roles = request.Roles?.Trim() ?? string.Empty,
                Username = username,
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                TeamTypeId = request.TeamTypeId.Value,
                PasswordHash = _passwordService.HashPassword(tempPassword),
                IsAdmin = request.IsAdmin,
                IsActive = request.IsActive,
                MustChangePasswordOnFirstLogin = true,
                LastLoginAt = null
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUsers), new { id = user.UserNumber }, new CreateUserResponse
            {
                User = user,
                TemporaryPassword = tempPassword
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest updatedUser)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(updatedUser.Email) && !IsValidEmail(updatedUser.Email.Trim()))
                return BadRequest(new { message = "Enter a valid email address" });

            if (updatedUser.TeamTypeId.HasValue && updatedUser.TeamTypeId.Value <= 0)
                return BadRequest(new { message = "Team type is required." });

            if (!string.IsNullOrWhiteSpace(updatedUser.SSN))
                user.SSN = updatedUser.SSN.Trim();
            if (!string.IsNullOrWhiteSpace(updatedUser.FirstName))
                user.FirstName = updatedUser.FirstName.Trim();
            if (!string.IsNullOrWhiteSpace(updatedUser.LastName))
                user.LastName = updatedUser.LastName.Trim();
            user.MiddleInitial = string.IsNullOrWhiteSpace(updatedUser.MiddleInitial) ? null : updatedUser.MiddleInitial.Trim();
            user.Roles = updatedUser.Roles?.Trim() ?? user.Roles;
            if (!string.IsNullOrWhiteSpace(updatedUser.Username))
                user.Username = updatedUser.Username.Trim();
            user.Email = string.IsNullOrWhiteSpace(updatedUser.Email) ? null : updatedUser.Email.Trim();
            if (updatedUser.TeamTypeId.HasValue)
                user.TeamTypeId = updatedUser.TeamTypeId.Value;
            if (updatedUser.IsAdmin.HasValue)
                user.IsAdmin = updatedUser.IsAdmin.Value;
            if (updatedUser.IsActive.HasValue)
                user.IsActive = updatedUser.IsActive.Value;
            if (updatedUser.MustChangePasswordOnFirstLogin.HasValue)
                user.MustChangePasswordOnFirstLogin = updatedUser.MustChangePasswordOnFirstLogin.Value;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
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

        private static string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
            var random = new Random();
            return new string(Enumerable.Range(0, 12).Select(_ => chars[random.Next(chars.Length)]).ToArray());
        }
    }

    public class CreateUserRequest
    {
        public string? SSN { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? MiddleInitial { get; set; }
        public string? Roles { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public int? TeamTypeId { get; set; }
        public bool IsAdmin { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateUserRequest
    {
        public string? SSN { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? MiddleInitial { get; set; }
        public string? Roles { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public int? TeamTypeId { get; set; }
        public bool? IsAdmin { get; set; }
        public bool? IsActive { get; set; }
        public bool? MustChangePasswordOnFirstLogin { get; set; }
    }

    public class CreateUserResponse
    {
        public User User { get; set; } = null!;
        public string TemporaryPassword { get; set; } = string.Empty;
    }
}
