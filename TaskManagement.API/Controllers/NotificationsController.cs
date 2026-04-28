using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public NotificationsController(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Get current user's notification preferences
        /// </summary>
        [HttpGet("Preferences")]
        public async Task<ActionResult<NotificationPreferenceDto>> GetMyPreferences()
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User ID not found in token");

                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserNumber == userId.Value);

                if (prefs == null)
                {
                    // Create default preferences if they don't exist
                    prefs = new NotificationPreference { UserNumber = userId.Value };
                    _context.NotificationPreferences.Add(prefs);
                    await _context.SaveChangesAsync();
                }

                var dto = new NotificationPreferenceDto
                {
                    TaskAssignedEmail = prefs.TaskAssignedEmail,
                    TaskCompletedEmail = prefs.TaskCompletedEmail,
                    TaskDueSoonEmail = prefs.TaskDueSoonEmail,
                    TaskStatusChangeEmail = prefs.TaskStatusChangeEmail,
                    DailyDigestEmail = prefs.DailyDigestEmail,
                    DigestTime = prefs.DigestTime
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving preferences: {ex.Message}" });
            }
        }

        /// <summary>
        /// Update notification preferences
        /// </summary>
        [HttpPut("Preferences")]
        public async Task<ActionResult<NotificationPreferenceDto>> UpdatePreferences([FromBody] UpdateNotificationPreferenceRequest request)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User ID not found in token");

                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserNumber == userId.Value);

                if (prefs == null)
                {
                    prefs = new NotificationPreference { UserNumber = userId.Value };
                    _context.NotificationPreferences.Add(prefs);
                }

                prefs.TaskAssignedEmail = request.TaskAssignedEmail ?? prefs.TaskAssignedEmail;
                prefs.TaskCompletedEmail = request.TaskCompletedEmail ?? prefs.TaskCompletedEmail;
                prefs.TaskDueSoonEmail = request.TaskDueSoonEmail ?? prefs.TaskDueSoonEmail;
                prefs.TaskStatusChangeEmail = request.TaskStatusChangeEmail ?? prefs.TaskStatusChangeEmail;
                prefs.DailyDigestEmail = request.DailyDigestEmail ?? prefs.DailyDigestEmail;
                prefs.DigestTime = request.DigestTime ?? prefs.DigestTime;
                prefs.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var dto = new NotificationPreferenceDto
                {
                    TaskAssignedEmail = prefs.TaskAssignedEmail,
                    TaskCompletedEmail = prefs.TaskCompletedEmail,
                    TaskDueSoonEmail = prefs.TaskDueSoonEmail,
                    TaskStatusChangeEmail = prefs.TaskStatusChangeEmail,
                    DailyDigestEmail = prefs.DailyDigestEmail,
                    DigestTime = prefs.DigestTime
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating preferences: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get notification history for current user (paginated)
        /// </summary>
        [HttpGet("History")]
        public async Task<ActionResult<IEnumerable<NotificationLogDto>>> GetNotificationHistory(int skip = 0, int take = 20)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized("User ID not found in token");

                var logs = await _context.NotificationLogs
                    .Where(nl => nl.RecipientUserId == userId.Value)
                    .Include(nl => nl.Template)
                    .Include(nl => nl.RelatedTask)
                    .OrderByDescending(nl => nl.CreatedAt)
                    .Skip(skip)
                    .Take(take)
                    .ToListAsync();

                var dtos = logs.Select(l => new NotificationLogDto
                {
                    LogId = l.LogId,
                    Subject = l.Subject,
                    Status = l.Status,
                    CreatedAt = l.CreatedAt,
                    SentAt = l.SentAt,
                    TemplateName = l.Template?.Name,
                    RelatedTaskName = l.RelatedTask?.Name,
                    RecipientEmail = l.RecipientEmail,
                    ErrorMessage = l.ErrorMessage
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving history: {ex.Message}" });
            }
        }

        /// <summary>
        /// Mark notification as read (for logging purposes)
        /// </summary>
        [HttpPost("{id}/Read")]
        public async Task<IActionResult> MarkNotificationAsRead(int id)
        {
            try
            {
                var log = await _context.NotificationLogs.FindAsync(id);
                if (log == null)
                    return NotFound("Notification not found");

                // In a real app, you'd track "read" status
                // For now, just return success
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error marking as read: {ex.Message}" });
            }
        }

        /// <summary>
        /// Delete a notification (archive)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var log = await _context.NotificationLogs.FindAsync(id);
                if (log == null)
                    return NotFound("Notification not found");

                _context.NotificationLogs.Remove(log);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting notification: {ex.Message}" });
            }
        }

        private int? GetCurrentUserId()
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }
    }

    // DTOs
    public class NotificationPreferenceDto
    {
        public bool TaskAssignedEmail { get; set; }
        public bool TaskCompletedEmail { get; set; }
        public bool TaskDueSoonEmail { get; set; }
        public bool TaskStatusChangeEmail { get; set; }
        public bool DailyDigestEmail { get; set; }
        public string DigestTime { get; set; }
    }

    public class NotificationLogDto
    {
        public int LogId { get; set; }
        public string Subject { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public string TemplateName { get; set; }
        public string RelatedTaskName { get; set; }
        public string RecipientEmail { get; set; }
        public string ErrorMessage { get; set; }
    }

    public class UpdateNotificationPreferenceRequest
    {
        public bool? TaskAssignedEmail { get; set; }
        public bool? TaskCompletedEmail { get; set; }
        public bool? TaskDueSoonEmail { get; set; }
        public bool? TaskStatusChangeEmail { get; set; }
        public bool? DailyDigestEmail { get; set; }
        public string DigestTime { get; set; }
    }
}
