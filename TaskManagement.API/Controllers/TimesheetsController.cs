using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TimesheetsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TimesheetsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("task/{taskId}")]
        public async Task<ActionResult<IEnumerable<TimesheetEntryDto>>> GetTaskTimesheets(int taskId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var task = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskItemId == taskId);
            if (task == null)
                return NotFound();

            if (!IsAdmin() && task.AssignedToUserId != userId.Value)
                return Forbid();

            var query = _context.TimesheetEntries
                .AsNoTracking()
                .Include(t => t.User)
                .Where(t => t.TaskId == taskId);

            if (!IsAdmin())
                query = query.Where(t => t.UserNumber == userId.Value);

            return await query
                .OrderByDescending(t => t.WorkDate)
                .ThenByDescending(t => t.CreatedAt)
                .Select(t => new TimesheetEntryDto
                {
                    TimesheetEntryId = t.TimesheetEntryId,
                    TaskId = t.TaskId,
                    UserNumber = t.UserNumber,
                    UserName = t.User == null ? string.Empty : t.User.FullName,
                    WorkDate = t.WorkDate,
                    Hours = t.Hours,
                    Notes = t.Notes,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<TimesheetEntryDto>> CreateTimesheet(CreateTimesheetEntryRequest request)
        {
            if (IsAdmin())
                return Forbid();

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (request.TaskId <= 0)
                return BadRequest(new { message = "Task is required." });

            if (request.Hours <= 0 || request.Hours > 24)
                return BadRequest(new { message = "Hours must be greater than 0 and no more than 24." });

            var task = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.TaskItemId == request.TaskId);
            if (task == null)
                return NotFound();

            if (task.AssignedToUserId != userId.Value)
                return Forbid();

            var workDate = (request.WorkDate ?? DateTime.UtcNow).Date;
            if (workDate > DateTime.UtcNow.Date.AddDays(1))
                return BadRequest(new { message = "Work date cannot be in the future." });

            var entry = new TimesheetEntry
            {
                TaskId = request.TaskId,
                UserNumber = userId.Value,
                WorkDate = workDate,
                Hours = Math.Round(request.Hours, 2),
                Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.TimesheetEntries.Add(entry);
            await _context.SaveChangesAsync();

            var dto = new TimesheetEntryDto
            {
                TimesheetEntryId = entry.TimesheetEntryId,
                TaskId = entry.TaskId,
                UserNumber = entry.UserNumber,
                WorkDate = entry.WorkDate,
                Hours = entry.Hours,
                Notes = entry.Notes,
                CreatedAt = entry.CreatedAt,
                UpdatedAt = entry.UpdatedAt
            };

            return CreatedAtAction(nameof(GetTaskTimesheets), new { taskId = entry.TaskId }, dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTimesheet(int id)
        {
            if (IsAdmin())
                return Forbid();

            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var entry = await _context.TimesheetEntries.FindAsync(id);
            if (entry == null)
                return NotFound();

            if (entry.UserNumber != userId.Value)
                return Forbid();

            _context.TimesheetEntries.Remove(entry);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }

        private bool IsAdmin() => User.IsInRole("Admin");
    }

    public class CreateTimesheetEntryRequest
    {
        public int TaskId { get; set; }
        public DateTime? WorkDate { get; set; }
        public decimal Hours { get; set; }
        public string? Notes { get; set; }
    }

    public class TimesheetEntryDto
    {
        public int TimesheetEntryId { get; set; }
        public int TaskId { get; set; }
        public int UserNumber { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime WorkDate { get; set; }
        public decimal Hours { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
