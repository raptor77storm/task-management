using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttachmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAttachmentService _attachmentService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AttachmentsController(
            AppDbContext context,
            IAttachmentService attachmentService,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _attachmentService = attachmentService;
            _httpContextAccessor = httpContextAccessor;
        }

        // Get all attachments for a specific task
        [HttpGet("Task/{taskId}")]
        public async Task<ActionResult<IEnumerable<AttachmentDto>>> GetTaskAttachments(int taskId)
        {
            try
            {
                var attachments = await _context.Attachments
                    .Where(a => a.TaskId == taskId)
                    .Include(a => a.UploadedByUser)
                    .OrderByDescending(a => a.UploadedAt)
                    .ToListAsync();

                var dtos = attachments.Select(a => new AttachmentDto
                {
                    AttachmentId = a.AttachmentId,
                    TaskId = a.TaskId,
                    FileName = a.FileName,
                    FileType = a.FileType,
                    FileSize = a.FileSize,
                    UploadedAt = a.UploadedAt,
                    UploadedByUserName = a.UploadedByUser?.FullName ?? "Unknown",
                    UploadedByUserId = a.UploadedByUserId
                });

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error retrieving attachments: {ex.Message}" });
            }
        }

        // Upload a file attachment
        [HttpPost]
        public async Task<ActionResult<AttachmentDto>> UploadAttachment(int taskId, IFormFile file)
        {
            try
            {
                // Verify task exists
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null)
                {
                    return NotFound("Task not found");
                }

                // Get current user ID from context (requires auth)
                var userIdStr = _httpContextAccessor.HttpContext?.User.FindFirst("UserNumber")?.Value;
                if (!int.TryParse(userIdStr, out int userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest("File is required");
                }

                // Save file
                string filePath = await _attachmentService.SaveFileAsync(file, taskId, userId);

                // Create attachment record
                var attachment = new Attachment
                {
                    TaskId = taskId,
                    FileName = file.FileName,
                    FilePath = filePath,
                    FileType = file.ContentType,
                    FileSize = file.Length,
                    UploadedByUserId = userId,
                    UploadedAt = DateTime.UtcNow
                };

                _context.Attachments.Add(attachment);
                await _context.SaveChangesAsync();

                // Log audit
                var auditService = HttpContext.RequestServices.GetService<IAuditService>();
                if (auditService != null)
                {
                    await auditService.LogAsync(userId, "Create", "Attachment", taskId, 
                        $"Uploaded file: {file.FileName}", 
                        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                        _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString());
                }

                var dto = new AttachmentDto
                {
                    AttachmentId = attachment.AttachmentId,
                    TaskId = attachment.TaskId,
                    FileName = attachment.FileName,
                    FileType = attachment.FileType,
                    FileSize = attachment.FileSize,
                    UploadedAt = attachment.UploadedAt,
                    UploadedByUserId = attachment.UploadedByUserId,
                    UploadedByUserName = "You"
                };

                return CreatedAtAction(nameof(GetTaskAttachments), new { taskId = taskId }, dto);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error uploading file: {ex.Message}" });
            }
        }

        // Download a file attachment
        [HttpGet("{id}/Download")]
        [Authorize]
        public async Task<IActionResult> DownloadAttachment(int id)
        {
            try
            {
                var attachment = await _context.Attachments.FindAsync(id);
                if (attachment == null)
                {
                    return NotFound("Attachment not found");
                }

                var fileBytes = await _attachmentService.GetFileAsync(attachment.FilePath);

                return File(fileBytes, attachment.FileType, attachment.FileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found on server");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error downloading file: {ex.Message}" });
            }
        }

        // Delete an attachment
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttachment(int id)
        {
            try
            {
                var attachment = await _context.Attachments.FindAsync(id);
                if (attachment == null)
                {
                    return NotFound("Attachment not found");
                }

                // Get current user ID
                var userIdStr = _httpContextAccessor.HttpContext?.User.FindFirst("UserNumber")?.Value;
                if (!int.TryParse(userIdStr, out int userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                // Delete from file system
                await _attachmentService.DeleteFileAsync(attachment.FilePath);

                // Delete from database
                _context.Attachments.Remove(attachment);
                await _context.SaveChangesAsync();

                // Log audit
                var auditService = HttpContext.RequestServices.GetService<IAuditService>();
                if (auditService != null)
                {
                    await auditService.LogAsync(userId, "Delete", "Attachment", id,
                        $"Deleted file: {attachment.FileName}",
                        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                        _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString());
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Error deleting attachment: {ex.Message}" });
            }
        }
    }

    // DTO for attachment responses
    public class AttachmentDto
    {
        public int AttachmentId { get; set; }
        public int TaskId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
        public string UploadedByUserName { get; set; } = string.Empty;
        public int? UploadedByUserId { get; set; }

        // Helper: Format file size nicely
        public string FormattedFileSize => FormatFileSize(FileSize);

        // Helper: Get file icon based on type
        public string FileIcon => GetFileIcon(FileType);

        private static string FormatFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            return $"{len:0.##} {sizes[order]}";
        }

        private static string GetFileIcon(string fileType)
        {
            return fileType switch
            {
                "application/pdf" => "📄",
                "image/png" or "image/jpeg" or "image/jpg" or "image/gif" => "🖼️",
                "application/msword" or "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => "📝",
                "application/vnd.ms-excel" or "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => "📊",
                "application/vnd.ms-powerpoint" or "application/vnd.openxmlformats-officedocument.presentationml.presentation" => "🎯",
                "application/zip" or "application/x-rar-compressed" => "📦",
                "text/plain" => "📋",
                _ => "📎"
            };
        }
    }
}
