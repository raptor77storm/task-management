using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AuditController : ControllerBase
    {
        private readonly IAuditService _auditService;

        public AuditController(IAuditService auditService)
        {
            _auditService = auditService;
        }

        /// <summary>
        /// Get recent audit logs (Admin only)
        /// </summary>
        [HttpGet("recent")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetRecentLogs(int limit = 50)
        {
            var logs = await _auditService.GetRecentLogsAsync(limit);
            return Ok(logs);
        }

        /// <summary>
        /// Get audit logs for a specific user (Admin only)
        /// </summary>
        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetUserLogs(int userId, int limit = 100)
        {
            var logs = await _auditService.GetLogsByUserAsync(userId, limit);
            return Ok(logs);
        }

        /// <summary>
        /// Get audit logs for a specific entity (Admin only)
        /// </summary>
        [HttpGet("entity/{entityType}/{entityId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetEntityLogs(string entityType, int entityId, int limit = 50)
        {
            var logs = await _auditService.GetLogsByEntityAsync(entityType, entityId, limit);
            return Ok(logs);
        }

        /// <summary>
        /// Get my own audit logs
        /// </summary>
        [HttpGet("my-logs")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetMyLogs(int limit = 50)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized();

            var logs = await _auditService.GetLogsByUserAsync(userId, limit);
            return Ok(logs);
        }
    }
}
