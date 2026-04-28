using System.Security.Claims;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IAuditService
    {
        Task LogAsync(int userId, string action, string entityType, int? entityId, 
            string? oldValue = null, string? newValue = null, string? description = null);
        Task<IEnumerable<AuditLog>> GetLogsByUserAsync(int userId, int limit = 100);
        Task<IEnumerable<AuditLog>> GetLogsByEntityAsync(string entityType, int entityId, int limit = 50);
        Task<IEnumerable<AuditLog>> GetRecentLogsAsync(int limit = 50);
    }

    public class AuditService : IAuditService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(int userId, string action, string entityType, int? entityId,
            string? oldValue = null, string? newValue = null, string? description = null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return;

            var ipAddress = _httpContextAccessor?.HttpContext?.Connection?.RemoteIpAddress?.ToString();

            var auditLog = new AuditLog
            {
                UserId = userId,
                Username = user.Username,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValue = oldValue,
                NewValue = newValue,
                Timestamp = DateTime.UtcNow,
                IpAddress = ipAddress,
                Description = description
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetLogsByUserAsync(int userId, int limit = 100)
        {
            return await Task.FromResult(_context.AuditLogs
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToList());
        }

        public async Task<IEnumerable<AuditLog>> GetLogsByEntityAsync(string entityType, int entityId, int limit = 50)
        {
            return await Task.FromResult(_context.AuditLogs
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToList());
        }

        public async Task<IEnumerable<AuditLog>> GetRecentLogsAsync(int limit = 50)
        {
            return await Task.FromResult(_context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToList());
        }
    }
}
