using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IProjectTemplateService
    {
        Task<IEnumerable<ProjectTemplate>> GetTemplatesAsync(bool includePrivate = false);
        Task<ProjectTemplate> GetTemplateAsync(int templateId);
        Task<ProjectTemplate> CreateTemplateAsync(ProjectTemplate template, List<TemplateTask> templateTasks);
        Task<ProjectTemplate> UpdateTemplateAsync(int templateId, ProjectTemplate template);
        Task DeleteTemplateAsync(int templateId);
        Task<Project> CreateProjectFromTemplateAsync(int templateId, int programmmeId, string projectName, DateTime projectStartDate);
    }

    public class ProjectTemplateService : IProjectTemplateService
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public ProjectTemplateService(AppDbContext context, IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        public async Task<IEnumerable<ProjectTemplate>> GetTemplatesAsync(bool includePrivate = false)
        {
            IQueryable<ProjectTemplate> query = _context.ProjectTemplates
                .Include(pt => pt.TemplateTasks)
                .Include(pt => pt.CreatedByUser);

            if (!includePrivate)
            {
                query = query.Where(pt => pt.IsPublic);
            }

            return await query.OrderByDescending(pt => pt.CreatedAt).ToListAsync();
        }

        public async Task<ProjectTemplate> GetTemplateAsync(int templateId)
        {
            return await _context.ProjectTemplates
                .Include(pt => pt.TemplateTasks)
                .Include(pt => pt.CreatedByUser)
                .FirstOrDefaultAsync(pt => pt.TemplateId == templateId);
        }

        public async Task<ProjectTemplate> CreateTemplateAsync(ProjectTemplate template, List<TemplateTask> templateTasks)
        {
            template.CreatedAt = DateTime.UtcNow;

            _context.ProjectTemplates.Add(template);
            await _context.SaveChangesAsync();

            // Add template tasks
            if (templateTasks != null && templateTasks.Any())
            {
                foreach (var task in templateTasks)
                {
                    task.TemplateId = template.TemplateId;
                }
                _context.TemplateTasks.AddRange(templateTasks);
                await _context.SaveChangesAsync();
            }

            return template;
        }

        public async Task<ProjectTemplate> UpdateTemplateAsync(int templateId, ProjectTemplate template)
        {
            var existingTemplate = await _context.ProjectTemplates
                .Include(pt => pt.TemplateTasks)
                .FirstOrDefaultAsync(pt => pt.TemplateId == templateId);

            if (existingTemplate == null)
                throw new KeyNotFoundException($"Template {templateId} not found");

            existingTemplate.Name = template.Name;
            existingTemplate.Description = template.Description;
            existingTemplate.IsPublic = template.IsPublic;
            existingTemplate.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingTemplate;
        }

        public async Task DeleteTemplateAsync(int templateId)
        {
            var template = await _context.ProjectTemplates.FindAsync(templateId);
            if (template == null)
                throw new KeyNotFoundException($"Template {templateId} not found");

            _context.ProjectTemplates.Remove(template);
            await _context.SaveChangesAsync();
        }

        public async Task<Project> CreateProjectFromTemplateAsync(int templateId, int programmeId, string projectName, DateTime projectStartDate)
        {
            var template = await GetTemplateAsync(templateId);
            if (template == null)
                throw new KeyNotFoundException($"Template {templateId} not found");

            var programme = await _context.Programmes.FindAsync(programmeId);
            if (programme == null)
                throw new KeyNotFoundException($"Programme {programmeId} not found");

            // Create project
            var project = new Project
            {
                Name = projectName,
                Description = $"Created from template: {template.Name}",
                StartDate = projectStartDate,
                EndDate = projectStartDate.AddDays(30), // Default 30 days
                ProgrammeId = programmeId,
                Status = "Planning",
                Priority = "Medium"
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            // Create tasks from template
            var templateTasks = await _context.TemplateTasks
                .Where(tt => tt.TemplateId == templateId)
                .OrderBy(tt => tt.OrderIndex)
                .ToListAsync();

            var createdTaskMap = new Dictionary<int, TaskItem>(); // Map template task ID to created task

            foreach (var templateTask in templateTasks)
            {
                var taskStartDate = projectStartDate.AddDays(templateTask.StartDateOffsetDays);
                var taskEndDate = taskStartDate.AddDays(templateTask.DurationDays);

                var newTask = new TaskItem
                {
                    Name = templateTask.Name,
                    Description = templateTask.Description,
                    ProjectId = project.ProjectId,
                    StartDate = taskStartDate,
                    EndDate = taskEndDate,
                    Status = templateTask.Status,
                    Priority = templateTask.Priority
                };

                // Set predecessor task if exists
                if (templateTask.PredecessorTemplateTaskId.HasValue && 
                    createdTaskMap.TryGetValue(templateTask.PredecessorTemplateTaskId.Value, out var predecessorTask))
                {
                    newTask.PredecessorTaskId = predecessorTask.TaskItemId;
                }

                _context.Tasks.Add(newTask);
                await _context.SaveChangesAsync(); // Save immediately to get ID for mapping

                createdTaskMap[templateTask.TemplateTaskId] = newTask;
            }

            // Increment usage count
            template.UsageCount++;
            await _context.SaveChangesAsync();

            return project;
        }
    }
}
