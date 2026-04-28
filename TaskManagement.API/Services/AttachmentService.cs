using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IAttachmentService
    {
        Task<string> SaveFileAsync(IFormFile file, int taskId, int uploadedByUserId);
        Task<byte[]> GetFileAsync(string filePath);
        Task DeleteFileAsync(string filePath);
        string GetRelativeFilePath(int taskId, string fileName);
    }

    public class AttachmentService : IAttachmentService
    {
        private readonly string _uploadDir;
        private const long MaxFileSize = 50 * 1024 * 1024; // 50 MB

        public AttachmentService(IWebHostEnvironment env)
        {
            _uploadDir = Path.Combine(env.ContentRootPath, "uploads", "attachments");
            EnsureUploadDirectoryExists();
        }

        private void EnsureUploadDirectoryExists()
        {
            if (!Directory.Exists(_uploadDir))
            {
                Directory.CreateDirectory(_uploadDir);
            }
        }

        public async Task<string> SaveFileAsync(IFormFile file, int taskId, int uploadedByUserId)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is empty");
            }

            if (file.Length > MaxFileSize)
            {
                throw new ArgumentException($"File size exceeds maximum allowed size of {MaxFileSize / (1024 * 1024)}MB");
            }

            try
            {
                // Create task-specific directory
                string taskDir = Path.Combine(_uploadDir, taskId.ToString());
                if (!Directory.Exists(taskDir))
                {
                    Directory.CreateDirectory(taskDir);
                }

                // Generate unique filename with timestamp
                string timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss_");
                string uniqueFileName = timestamp + Path.GetFileName(file.FileName);
                string filePath = Path.Combine(taskDir, uniqueFileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative path for storage in DB
                return Path.Combine("attachments", taskId.ToString(), uniqueFileName)
                    .Replace("\\", "/"); // Normalize to forward slashes
            }
            catch (Exception ex)
            {
                throw new IOException($"Error saving file: {ex.Message}", ex);
            }
        }

        public async Task<byte[]> GetFileAsync(string filePath)
        {
            try
            {
                string fullPath = Path.Combine(_uploadDir, "..", filePath
                    .Replace("/", Path.DirectorySeparatorChar.ToString()));

                if (!File.Exists(fullPath))
                {
                    throw new FileNotFoundException("File not found");
                }

                return await File.ReadAllBytesAsync(fullPath);
            }
            catch (Exception ex)
            {
                throw new IOException($"Error reading file: {ex.Message}", ex);
            }
        }

        public async Task DeleteFileAsync(string filePath)
        {
            try
            {
                string fullPath = Path.Combine(_uploadDir, "..", filePath
                    .Replace("/", Path.DirectorySeparatorChar.ToString()));

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }

                // Clean up empty directories
                string directory = Path.GetDirectoryName(fullPath);
                if (Directory.Exists(directory) && Directory.GetFiles(directory).Length == 0)
                {
                    Directory.Delete(directory);
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                throw new IOException($"Error deleting file: {ex.Message}", ex);
            }
        }

        public string GetRelativeFilePath(int taskId, string fileName)
        {
            return Path.Combine("attachments", taskId.ToString(), fileName)
                .Replace("\\", "/");
        }
    }
}
