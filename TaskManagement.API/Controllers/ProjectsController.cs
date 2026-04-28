using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectSummaryDto>>> GetProjects()
        {
            var projects = await _context.Projects
                .AsNoTracking()
                .Select(p => new ProjectSummaryDto
                {
                    ProjectId = p.ProjectId,
                    Name = p.Name,
                    Description = p.Description,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.Status,
                    Priority = p.Priority,
                    ProgrammeId = p.ProgrammeId,
                    CalculatedEndDate = p.CalculatedEndDate,
                    TaskCount = p.Tasks == null ? 0 : p.Tasks.Count
                })
                .ToListAsync();

            return projects;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectSummaryDto>> GetProject(int id)
        {
            var project = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ProjectId == id)
                .Select(p => new ProjectSummaryDto
                {
                    ProjectId = p.ProjectId,
                    Name = p.Name,
                    Description = p.Description,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.Status,
                    Priority = p.Priority,
                    ProgrammeId = p.ProgrammeId,
                    CalculatedEndDate = p.CalculatedEndDate,
                    TaskCount = p.Tasks == null ? 0 : p.Tasks.Count
                })
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound();

            return project;
        }

        [HttpGet("programme/{programmeId}")]
        public async Task<ActionResult<IEnumerable<ProjectSummaryDto>>> GetProjectsByProgramme(int programmeId)
        {
            var projects = await _context.Projects
                .AsNoTracking()
                .Where(p => p.ProgrammeId == programmeId)
                .Select(p => new ProjectSummaryDto
                {
                    ProjectId = p.ProjectId,
                    Name = p.Name,
                    Description = p.Description,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    Status = p.Status,
                    Priority = p.Priority,
                    ProgrammeId = p.ProgrammeId,
                    CalculatedEndDate = p.CalculatedEndDate,
                    TaskCount = p.Tasks == null ? 0 : p.Tasks.Count
                })
                .ToListAsync();

            return projects;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Project>> CreateProject(CreateProjectRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Project name is required." });

            var programmeId = request.ProgrammeId > 0
                ? request.ProgrammeId
                : await _context.Programmes.Select(p => p.Id).FirstOrDefaultAsync();

            if (programmeId == 0)
                return BadRequest(new { message = "A programme is required before a project can be created." });

            var programmeExists = await _context.Programmes.AnyAsync(p => p.Id == programmeId);
            if (!programmeExists)
                return BadRequest(new { message = "The selected programme does not exist." });

            var project = new Project
            {
                Name = request.Name.Trim(),
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = string.IsNullOrWhiteSpace(request.Status) ? "Not Started" : request.Status,
                Priority = string.IsNullOrWhiteSpace(request.Priority) ? "Medium" : request.Priority,
                ProgrammeId = programmeId,
                CalculatedEndDate = request.CalculatedEndDate
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.ProjectId }, project);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProject(int id, UpdateProjectRequest request)
        {
            var existingProject = await _context.Projects.FindAsync(id);
            if (existingProject == null)
                return NotFound();

            var hasTasks = await _context.Tasks.AnyAsync(t => t.ProjectId == id);
            if (hasTasks)
                return Conflict(new { message = "Project details can only be changed before tasks are added." });

            if (!string.IsNullOrWhiteSpace(request.Name))
                existingProject.Name = request.Name.Trim();

            existingProject.Description = request.Description;

            if (request.StartDate.HasValue)
                existingProject.StartDate = request.StartDate;

            if (request.EndDate.HasValue)
                existingProject.EndDate = request.EndDate;

            if (!string.IsNullOrWhiteSpace(request.Status))
                existingProject.Status = request.Status;

            if (!string.IsNullOrWhiteSpace(request.Priority))
                existingProject.Priority = request.Priority;

            if (request.ProgrammeId.HasValue && request.ProgrammeId.Value != existingProject.ProgrammeId)
            {
                var programmeExists = await _context.Programmes.AnyAsync(p => p.Id == request.ProgrammeId.Value);
                if (!programmeExists)
                    return BadRequest(new { message = "The selected programme does not exist." });

                existingProject.ProgrammeId = request.ProgrammeId.Value;
            }

            if (request.CalculatedEndDate.HasValue)
                existingProject.CalculatedEndDate = request.CalculatedEndDate;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects.FindAsync(id);

            if (project == null)
                return NotFound();

            var hasTasks = await _context.Tasks.AnyAsync(t => t.ProjectId == id);
            if (hasTasks)
                return Conflict(new { message = "Project can only be deleted before tasks are added." });

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class ProjectSummaryDto
    {
        public int ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; } = "Not Started";
        public string Priority { get; set; } = "Medium";
        public int ProgrammeId { get; set; }
        public DateTime? CalculatedEndDate { get; set; }
        public int TaskCount { get; set; }
    }

    public class CreateProjectRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public int ProgrammeId { get; set; }
        public DateTime? CalculatedEndDate { get; set; }
    }

    public class UpdateProjectRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public int? ProgrammeId { get; set; }
        public DateTime? CalculatedEndDate { get; set; }
    }
}
