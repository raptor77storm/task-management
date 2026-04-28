using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProjectTemplatesController : ControllerBase
    {
        private readonly IProjectTemplateService _templateService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ProjectTemplatesController(
            IProjectTemplateService templateService,
            IHttpContextAccessor httpContextAccessor)
        {
            _templateService = templateService;
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// Get all available templates (public + private if user is admin)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectTemplateDto>>> GetTemplates()
        {
            try
            {
                var templates = await _templateService.GetTemplatesAsync();
                var dtos = templates.Select(t => new ProjectTemplateDto
                {
                    TemplateId = t.TemplateId,
                    Name = t.Name,
                    Description = t.Description,
                    IsPublic = t.IsPublic,
                    CreatedAt = t.CreatedAt,
                    UsageCount = t.UsageCount,
                    CreatedByUserName = t.CreatedByUser?.FullName,
                    TaskCount = t.TemplateTasks?.Count ?? 0
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving templates: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get a specific template with detailed task breakdown
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectTemplateDetailDto>> GetTemplate(int id)
        {
            try
            {
                var template = await _templateService.GetTemplateAsync(id);
                if (template == null)
                    return NotFound("Template not found");

                var dto = new ProjectTemplateDetailDto
                {
                    TemplateId = template.TemplateId,
                    Name = template.Name,
                    Description = template.Description,
                    IsPublic = template.IsPublic,
                    CreatedAt = template.CreatedAt,
                    UsageCount = template.UsageCount,
                    CreatedByUserName = template.CreatedByUser?.FullName,
                    TemplateTasks = template.TemplateTasks?.Select(t => new TemplateTaskDto
                    {
                        TemplateTaskId = t.TemplateTaskId,
                        Name = t.Name,
                        Description = t.Description,
                        OrderIndex = t.OrderIndex,
                        StartDateOffsetDays = t.StartDateOffsetDays,
                        DurationDays = t.DurationDays,
                        Priority = t.Priority,
                        Status = t.Status
                    }).OrderBy(t => t.OrderIndex).ToList() ?? new List<TemplateTaskDto>()
                };

                return Ok(dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving template: {ex.Message}" });
            }
        }

        /// <summary>
        /// Create a new project template
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ProjectTemplateDto>> CreateTemplate([FromBody] CreateProjectTemplateRequest request)
        {
            try
            {
                // Get current user ID
                var userIdStr = _httpContextAccessor.HttpContext?.User.FindFirst("UserNumber")?.Value;
                if (!int.TryParse(userIdStr, out int userId))
                    return Unauthorized("User ID not found in token");

                var template = new ProjectTemplate
                {
                    Name = request.Name,
                    Description = request.Description,
                    CreatedByUserId = userId,
                    IsPublic = request.IsPublic ?? false
                };

                var templateTasks = request.TemplateTasks?.Select(t => new TemplateTask
                {
                    Name = t.Name,
                    Description = t.Description,
                    OrderIndex = t.OrderIndex,
                    StartDateOffsetDays = t.StartDateOffsetDays,
                    DurationDays = t.DurationDays,
                    Priority = t.Priority ?? "Medium",
                    Status = t.Status ?? "Not Started",
                    PredecessorTemplateTaskId = t.PredecessorTemplateTaskId
                }).ToList();

                var createdTemplate = await _templateService.CreateTemplateAsync(template, templateTasks);

                var dto = new ProjectTemplateDto
                {
                    TemplateId = createdTemplate.TemplateId,
                    Name = createdTemplate.Name,
                    Description = createdTemplate.Description,
                    IsPublic = createdTemplate.IsPublic,
                    CreatedAt = createdTemplate.CreatedAt,
                    UsageCount = createdTemplate.UsageCount,
                    CreatedByUserName = createdTemplate.CreatedByUser?.FullName,
                    TaskCount = createdTemplate.TemplateTasks?.Count ?? 0
                };

                return CreatedAtAction(nameof(GetTemplate), new { id = createdTemplate.TemplateId }, dto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating template: {ex.Message}" });
            }
        }

        /// <summary>
        /// Create a project from a template
        /// </summary>
        [HttpPost("{id}/CreateProject")]
        public async Task<ActionResult<ProjectDto>> CreateProjectFromTemplate(int id, [FromBody] CreateProjectFromTemplateRequest request)
        {
            try
            {
                var project = await _templateService.CreateProjectFromTemplateAsync(
                    id,
                    request.ProgrammeId,
                    request.ProjectName,
                    request.ProjectStartDate);

                var dto = new ProjectDto
                {
                    Id = project.ProjectId,
                    Name = project.Name,
                    Description = project.Description,
                    StartDate = project.StartDate,
                    EndDate = project.EndDate,
                    Status = project.Status,
                    Priority = project.Priority,
                    ProgrammeId = project.ProgrammeId
                };

                return CreatedAtAction(nameof(GetTemplate), new { id = id }, dto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error creating project from template: {ex.Message}" });
            }
        }

        /// <summary>
        /// Update a template (name, description, visibility)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ProjectTemplateDto>> UpdateTemplate(int id, [FromBody] UpdateProjectTemplateRequest request)
        {
            try
            {
                var template = new ProjectTemplate
                {
                    Name = request.Name,
                    Description = request.Description,
                    IsPublic = request.IsPublic ?? false
                };

                var updatedTemplate = await _templateService.UpdateTemplateAsync(id, template);

                var dto = new ProjectTemplateDto
                {
                    TemplateId = updatedTemplate.TemplateId,
                    Name = updatedTemplate.Name,
                    Description = updatedTemplate.Description,
                    IsPublic = updatedTemplate.IsPublic,
                    CreatedAt = updatedTemplate.CreatedAt,
                    UsageCount = updatedTemplate.UsageCount,
                    CreatedByUserName = updatedTemplate.CreatedByUser?.FullName,
                    TaskCount = updatedTemplate.TemplateTasks?.Count ?? 0
                };

                return Ok(dto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error updating template: {ex.Message}" });
            }
        }

        /// <summary>
        /// Delete a template
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTemplate(int id)
        {
            try
            {
                await _templateService.DeleteTemplateAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting template: {ex.Message}" });
            }
        }
    }

    // DTOs
    public class ProjectTemplateDto
    {
        public int TemplateId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UsageCount { get; set; }
        public string CreatedByUserName { get; set; }
        public int TaskCount { get; set; }
    }

    public class ProjectTemplateDetailDto : ProjectTemplateDto
    {
        public List<TemplateTaskDto> TemplateTasks { get; set; }
    }

    public class ProjectDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; }
        public int ProgrammeId { get; set; }
    }

    public class TemplateTaskDto
    {
        public int TemplateTaskId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int OrderIndex { get; set; }
        public int StartDateOffsetDays { get; set; }
        public int DurationDays { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
    }

    public class CreateProjectTemplateRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool? IsPublic { get; set; }
        public List<CreateTemplateTaskRequest> TemplateTasks { get; set; }
    }

    public class CreateTemplateTaskRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int OrderIndex { get; set; }
        public int StartDateOffsetDays { get; set; }
        public int DurationDays { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public int? PredecessorTemplateTaskId { get; set; }
    }

    public class CreateProjectFromTemplateRequest
    {
        public int ProgrammeId { get; set; }
        public string ProjectName { get; set; }
        public DateTime ProjectStartDate { get; set; }
    }

    public class UpdateProjectTemplateRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool? IsPublic { get; set; }
    }
}
