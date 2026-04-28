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
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public TasksController(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
        {
            IQueryable<TaskItem> query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.TaskType);

            if (!IsAdmin())
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                query = query.Where(t => t.AssignedToUserId == userId.Value);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var task = await _context.Tasks
                .AsNoTracking()
                .Include(t => t.TaskType)
                .FirstOrDefaultAsync(t => t.TaskItemId == id);

            if (task == null)
                return NotFound();

            if (!CanViewTask(task))
                return Forbid();

            return task;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TaskItem>> CreateTask(CreateTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Task name is required." });

            if (!request.TaskTypeId.HasValue || request.TaskTypeId.Value <= 0)
                return BadRequest(new { message = "Task type is required." });

            var task = new TaskItem
            {
                ProjectId = request.ProjectId,
                ParentTaskId = request.ParentTaskId,
                AssignedToUserId = request.AssignedToUserId ?? request.AssignedTo,
                TaskTypeId = request.TaskTypeId.Value,
                Name = request.Name.Trim(),
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "Not Started" : request.Status,
                Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority,
                OverheadCosts = request.OverheadCosts ?? 0,
                PredecessorTaskId = request.PredecessorTaskId,
                BudgetAtCompletion = request.BudgetAtCompletion ?? 0,
                PlannedWorkPercentage = request.PlannedWorkPercentage ?? 0
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = task.TaskItemId }, task);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTask(int id, UpdateTaskRequest request)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedToUser)
                .FirstOrDefaultAsync(t => t.TaskItemId == id);

            if (task == null)
                return NotFound();

            var oldStatus = task.Status;

            if (request.ProjectId.HasValue)
                task.ProjectId = request.ProjectId.Value;

            if (request.ParentTaskId.HasValue)
                task.ParentTaskId = request.ParentTaskId;

            var assignedToUserId = request.AssignedToUserId ?? request.AssignedTo;
            if (assignedToUserId.HasValue)
                task.AssignedToUserId = assignedToUserId;

            if (request.TaskTypeId.HasValue)
            {
                if (request.TaskTypeId.Value <= 0)
                    return BadRequest(new { message = "Task type is required." });
                task.TaskTypeId = request.TaskTypeId.Value;
            }
            else if (task.TaskTypeId == null)
            {
                return BadRequest(new { message = "Task type is required." });
            }

            if (!string.IsNullOrWhiteSpace(request.Name))
                task.Name = request.Name.Trim();

            if (request.Description != null)
                task.Description = request.Description;

            if (request.StartDate.HasValue)
                task.StartDate = request.StartDate;

            if (request.EndDate.HasValue)
                task.EndDate = request.EndDate;

            if (!string.IsNullOrWhiteSpace(request.Status))
                task.Status = request.Status;

            if (!string.IsNullOrWhiteSpace(request.Priority))
                task.Priority = request.Priority;

            if (request.OverheadCosts.HasValue)
                task.OverheadCosts = request.OverheadCosts.Value;

            if (request.PredecessorTaskId.HasValue)
                task.PredecessorTaskId = request.PredecessorTaskId;

            if (request.BudgetAtCompletion.HasValue)
                task.BudgetAtCompletion = request.BudgetAtCompletion.Value;

            if (request.PlannedWorkPercentage.HasValue)
                task.PlannedWorkPercentage = request.PlannedWorkPercentage.Value;

            await _context.SaveChangesAsync();

            if (!string.Equals(oldStatus, task.Status, StringComparison.OrdinalIgnoreCase))
            {
                var changedBy = await GetCurrentUserAsync();
                await _emailService.SendTaskStatusChangedToAdminsAsync(task, changedBy, oldStatus);
            }

            return NoContent();
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, UpdateTaskStatusRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Status))
                return BadRequest(new { message = "Task status is required." });

            var task = await _context.Tasks
                .Include(t => t.AssignedToUser)
                .FirstOrDefaultAsync(t => t.TaskItemId == id);

            if (task == null)
                return NotFound();

            if (!CanViewTask(task))
                return Forbid();

            var oldStatus = task.Status;
            if (string.Equals(oldStatus, request.Status, StringComparison.OrdinalIgnoreCase))
                return NoContent();

            task.Status = request.Status;
            await _context.SaveChangesAsync();

            var changedBy = await GetCurrentUserAsync();
            await _emailService.SendTaskStatusChangedToAdminsAsync(task, changedBy, oldStatus);

            return NoContent();
        }

        [HttpPost("{id}/note-to-admin")]
        public async Task<IActionResult> SendTaskNoteToAdmin(int id, SendTaskNoteRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Note))
                return BadRequest(new { message = "Note is required." });

            var task = await _context.Tasks
                .Include(t => t.AssignedToUser)
                .FirstOrDefaultAsync(t => t.TaskItemId == id);

            if (task == null)
                return NotFound();

            if (!CanViewTask(task))
                return Forbid();

            var sender = await GetCurrentUserAsync();
            await _emailService.SendTaskNoteToAdminsAsync(task, sender, request.Note.Trim());

            return Ok(new { message = "Note sent to admin." });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);

            if (task == null)
                return NotFound();

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Get subtasks for a specific task
        [HttpGet("{id}/subtasks")]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetSubtasks(int id)
        {
            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.TaskType)
                .Where(t => t.ParentTaskId == id);

            if (!IsAdmin())
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                query = query.Where(t => t.AssignedToUserId == userId.Value);
            }

            return await query.ToListAsync();
        }

        // Get all tasks by project ID
        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasksByProject(int projectId)
        {
            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.TaskType)
                .Where(t => t.ProjectId == projectId);

            if (!IsAdmin())
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized();

                query = query.Where(t => t.AssignedToUserId == userId.Value);
            }

            return await query.ToListAsync();
        }

        // Assign task to user
        [HttpPut("{id}/assign/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignTask(int id, int userId)
        {
            var task = await _context.Tasks.FindAsync(id);

            if (task == null)
                return NotFound();

            task.AssignedToUserId = userId;
            _context.Entry(task).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out var userId) ? userId : null;
        }

        private async Task<User?> GetCurrentUserAsync()
        {
            var userId = GetCurrentUserId();
            return userId == null ? null : await _context.Users.FindAsync(userId.Value);
        }

        private bool IsAdmin() => User.IsInRole("Admin");

        private bool CanViewTask(TaskItem task)
        {
            if (IsAdmin())
                return true;

            var userId = GetCurrentUserId();
            return userId != null && task.AssignedToUserId == userId.Value;
        }
    }

    public class CreateTaskRequest
    {
        public int ProjectId { get; set; }
        public int? ParentTaskId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int? AssignedTo { get; set; }
        public int? TaskTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public decimal? OverheadCosts { get; set; }
        public int? PredecessorTaskId { get; set; }
        public decimal? BudgetAtCompletion { get; set; }
        public decimal? PlannedWorkPercentage { get; set; }
    }

    public class UpdateTaskRequest
    {
        public int? ProjectId { get; set; }
        public int? ParentTaskId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int? AssignedTo { get; set; }
        public int? TaskTypeId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public decimal? OverheadCosts { get; set; }
        public int? PredecessorTaskId { get; set; }
        public decimal? BudgetAtCompletion { get; set; }
        public decimal? PlannedWorkPercentage { get; set; }
    }

    public class UpdateTaskStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class SendTaskNoteRequest
    {
        public string Note { get; set; } = string.Empty;
    }
}
