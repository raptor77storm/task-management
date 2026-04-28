using System.Data;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly IEmailService _emailService;

        public AdminSettingsController(
            AppDbContext context,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
            _emailService = emailService;
        }

        [HttpGet("email")]
        public ActionResult<EmailConfigurationDto> GetEmailConfiguration()
        {
            return new EmailConfigurationDto
            {
                SmtpServer = _configuration["Email:SmtpServer"] ?? string.Empty,
                SmtpPort = int.TryParse(_configuration["Email:SmtpPort"], out var port) ? port : 587,
                SenderEmail = _configuration["Email:SenderEmail"] ?? string.Empty,
                SenderName = _configuration["Email:SenderName"] ?? "Task Management System",
                AdminEmail = _configuration["Email:AdminEmail"] ?? string.Empty,
                PasswordConfigured = !string.IsNullOrWhiteSpace(_configuration["Email:SenderPassword"])
                    && _configuration["Email:SenderPassword"] != "your-app-specific-password"
            };
        }

        [HttpPut("email")]
        public async Task<IActionResult> UpdateEmailConfiguration(UpdateEmailConfigurationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SmtpServer))
                return BadRequest(new { message = "SMTP server is required." });

            if (request.SmtpPort <= 0)
                return BadRequest(new { message = "SMTP port is required." });

            if (string.IsNullOrWhiteSpace(request.SenderEmail))
                return BadRequest(new { message = "Sender email is required." });

            if (string.IsNullOrWhiteSpace(request.AdminEmail))
                return BadRequest(new { message = "Admin email is required." });

            var appsettingsPath = Path.Combine(_environment.ContentRootPath, "appsettings.json");
            var json = await LoadAppSettingsAsync(appsettingsPath);
            var email = json["Email"] as JsonObject ?? new JsonObject();

            email["SmtpServer"] = request.SmtpServer.Trim();
            email["SmtpPort"] = request.SmtpPort.ToString();
            email["SenderEmail"] = request.SenderEmail.Trim();
            email["SenderName"] = string.IsNullOrWhiteSpace(request.SenderName) ? "Task Management System" : request.SenderName.Trim();
            email["AdminEmail"] = request.AdminEmail.Trim();

            if (!string.IsNullOrWhiteSpace(request.SenderPassword))
                email["SenderPassword"] = request.SenderPassword;

            json["Email"] = email;
            await SaveAppSettingsAsync(appsettingsPath, json);

            (_configuration as IConfigurationRoot)?.Reload();

            return NoContent();
        }

        [HttpPost("email/test")]
        public async Task<IActionResult> SendTestEmail()
        {
            var adminEmail = _configuration["Email:AdminEmail"];
            if (string.IsNullOrWhiteSpace(adminEmail))
                return BadRequest(new { message = "Admin email is not configured." });

            var sent = await _emailService.SendEmailAsync(
                adminEmail,
                "Task Management email test",
                "<p>Email configuration is working.</p>");

            return sent
                ? Ok(new { message = "Test email sent." })
                : StatusCode(500, new { message = "Test email could not be sent. Check SMTP credentials and server logs." });
        }

        [HttpGet("company")]
        public async Task<ActionResult<CompanyInfoDto>> GetCompanyInfo()
        {
            var organization = await _context.Organizations.AsNoTracking().OrderBy(o => o.Id).FirstOrDefaultAsync();
            return new CompanyInfoDto
            {
                Name = organization?.Name ?? string.Empty,
                Description = organization?.Description ?? string.Empty
            };
        }

        [HttpPut("company")]
        public async Task<IActionResult> UpdateCompanyInfo(CompanyInfoDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Company name is required." });

            var organization = await _context.Organizations.OrderBy(o => o.Id).FirstOrDefaultAsync();
            if (organization == null)
            {
                organization = new Organization();
                _context.Organizations.Add(organization);
            }

            organization.Name = request.Name.Trim();
            organization.Description = request.Description;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("backup")]
        public async Task<ActionResult<BackupResultDto>> BackupDatabase()
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
                return StatusCode(500, new { message = "Default database connection is not configured." });

            var builder = new SqlConnectionStringBuilder(connectionString);
            var databaseName = builder.InitialCatalog;
            if (string.IsNullOrWhiteSpace(databaseName))
                return StatusCode(500, new { message = "Database name is missing from the connection string." });

            builder.InitialCatalog = "master";
            var fileName = $"{databaseName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.bak";

            try
            {
                await using var connection = new SqlConnection(builder.ConnectionString);
                await connection.OpenAsync();

                var backupDirectory = await GetSqlServerBackupDirectoryAsync(connection);
                var backupPath = Path.Combine(backupDirectory, fileName);
                var sql = $"BACKUP DATABASE {QuoteSqlIdentifier(databaseName)} TO DISK = @path WITH INIT";

                await using var command = new SqlCommand(sql, connection);
                command.Parameters.Add("@path", SqlDbType.NVarChar, 4000).Value = backupPath;
                command.CommandTimeout = 300;
                await command.ExecuteNonQueryAsync();

                return new BackupResultDto
                {
                    FileName = fileName,
                    Path = backupPath,
                    CreatedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Backup failed: {ex.Message}" });
            }
        }

        [HttpPost("restore")]
        public async Task<IActionResult> RestoreDatabase(RestoreDatabaseRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.BackupPath))
                return BadRequest(new { message = "Backup path is required." });

            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
                return StatusCode(500, new { message = "Default database connection is not configured." });

            var builder = new SqlConnectionStringBuilder(connectionString);
            var databaseName = builder.InitialCatalog;
            if (string.IsNullOrWhiteSpace(databaseName))
                return StatusCode(500, new { message = "Database name is missing from the connection string." });

            builder.InitialCatalog = "master";
            try
            {
                await using var connection = new SqlConnection(builder.ConnectionString);
                await connection.OpenAsync();

                var escapedDatabase = QuoteSqlIdentifier(databaseName);
                await ExecuteSqlAsync(connection, $"ALTER DATABASE {escapedDatabase} SET SINGLE_USER WITH ROLLBACK IMMEDIATE");

                var restoreSql = $"RESTORE DATABASE {escapedDatabase} FROM DISK = @path WITH REPLACE";
                try
                {
                    await using var restoreCommand = new SqlCommand(restoreSql, connection);
                    restoreCommand.Parameters.Add("@path", SqlDbType.NVarChar, 4000).Value = request.BackupPath.Trim();
                    restoreCommand.CommandTimeout = 600;
                    await restoreCommand.ExecuteNonQueryAsync();
                }
                finally
                {
                    await ExecuteSqlAsync(connection, $"ALTER DATABASE {escapedDatabase} SET MULTI_USER");
                }

                return Ok(new { message = "Database restored. Restart the application before continuing work." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Restore failed: {ex.Message}" });
            }
        }

        private static async Task<JsonObject> LoadAppSettingsAsync(string path)
        {
            if (!System.IO.File.Exists(path))
                return new JsonObject();

            var content = await System.IO.File.ReadAllTextAsync(path);
            return JsonNode.Parse(content)?.AsObject() ?? new JsonObject();
        }

        private static async Task SaveAppSettingsAsync(string path, JsonObject json)
        {
            var options = new System.Text.Json.JsonSerializerOptions { WriteIndented = true };
            await System.IO.File.WriteAllTextAsync(path, json.ToJsonString(options));
        }

        private static async Task<string> GetSqlServerBackupDirectoryAsync(SqlConnection connection)
        {
            await using var command = new SqlCommand("SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))", connection);
            var result = await command.ExecuteScalarAsync();
            var path = result as string;

            if (!string.IsNullOrWhiteSpace(path))
                return path;

            await using var fallbackCommand = new SqlCommand("SELECT SUBSTRING(physical_name, 1, LEN(physical_name) - CHARINDEX('\\', REVERSE(physical_name))) FROM sys.master_files WHERE database_id = DB_ID('master') AND file_id = 1", connection);
            var fallback = await fallbackCommand.ExecuteScalarAsync() as string;
            return string.IsNullOrWhiteSpace(fallback) ? @"C:\Program Files\Microsoft SQL Server\MSSQL\Backup" : fallback;
        }

        private static async Task ExecuteSqlAsync(SqlConnection connection, string sql)
        {
            await using var command = new SqlCommand(sql, connection);
            command.CommandTimeout = 300;
            await command.ExecuteNonQueryAsync();
        }

        private static string QuoteSqlIdentifier(string value) => $"[{value.Replace("]", "]]")}]";
    }

    public class EmailConfigurationDto
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; }
        public string SenderEmail { get; set; } = string.Empty;
        public string SenderName { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public bool PasswordConfigured { get; set; }
    }

    public class UpdateEmailConfigurationRequest : EmailConfigurationDto
    {
        public string? SenderPassword { get; set; }
    }

    public class CompanyInfoDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class BackupResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class RestoreDatabaseRequest
    {
        public string BackupPath { get; set; } = string.Empty;
    }
}
