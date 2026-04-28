using System.Net;
using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string recipientEmail, string subject, string body, bool isHtml = true, string? replyToEmail = null);
        Task SendTaskAssignedNotificationAsync(TaskItem task, User assignedUser);
        Task SendTaskCompletedNotificationAsync(TaskItem task, User completedByUser);
        Task SendTaskDueSoonNotificationAsync(TaskItem task);
        Task SendTaskStatusChangedNotificationAsync(TaskItem task, User changedByUser, string oldStatus);
        Task SendTaskStatusChangedToAdminsAsync(TaskItem task, User? changedByUser, string oldStatus);
        Task SendTaskNoteToAdminsAsync(TaskItem task, User? sender, string note);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly ILogger<EmailService> _logger;

        public EmailService(
            IConfiguration configuration,
            AppDbContext context,
            ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _context = context;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string recipientEmail, string subject, string body, bool isHtml = true, string? replyToEmail = null)
        {
            try
            {
                var smtpServer = _configuration["Email:SmtpServer"];
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var senderEmail = _configuration["Email:SenderEmail"];
                var senderPassword = _configuration["Email:SenderPassword"];
                var senderName = _configuration["Email:SenderName"] ?? "Task Management";

                if (string.IsNullOrWhiteSpace(smtpServer)
                    || string.IsNullOrWhiteSpace(senderEmail)
                    || senderEmail == "your-email@gmail.com"
                    || string.IsNullOrWhiteSpace(senderPassword)
                    || senderPassword == "your-app-specific-password")
                {
                    _logger.LogWarning("Email service not configured");
                    return false; // Skip sending if not configured
                }

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(senderEmail, senderPassword);

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail, senderName),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = isHtml
                    };

                    foreach (var email in recipientEmail.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                    {
                        mailMessage.To.Add(email);
                    }
                    if (!string.IsNullOrWhiteSpace(replyToEmail))
                    {
                        mailMessage.ReplyToList.Add(new MailAddress(replyToEmail));
                    }

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation($"Email sent to {recipientEmail}: {subject}");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending email to {recipientEmail}: {ex.Message}");
                return false;
            }
        }

        public async Task SendTaskAssignedNotificationAsync(TaskItem task, User assignedUser)
        {
            try
            {
                if (assignedUser?.Email == null)
                    return;

                // Check user preferences
                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserNumber == assignedUser.UserNumber);

                if (prefs != null && !prefs.TaskAssignedEmail)
                    return;

                // Get template
                var template = await _context.NotificationTemplates
                    .FirstOrDefaultAsync(nt => nt.Name == "TaskAssigned" && nt.IsActive);

                if (template == null)
                    return;

                // Build body
                var body = template.BodyTemplate
                    .Replace("{{TaskName}}", task.Name ?? "")
                    .Replace("{{TaskDescription}}", task.Description ?? "")
                    .Replace("{{TaskDueDate}}", task.EndDate?.ToString("MMM dd, yyyy") ?? "Not set")
                    .Replace("{{Priority}}", task.Priority ?? "");

                // Send email
                var sent = await SendEmailAsync(assignedUser.Email, template.Subject, body);

                // Log notification
                var log = new NotificationLog
                {
                    RecipientUserId = assignedUser.UserNumber,
                    RelatedTaskId = task.TaskItemId,
                    TemplateId = template.TemplateId,
                    Subject = template.Subject,
                    Body = body,
                    RecipientEmail = assignedUser.Email,
                    Status = sent ? "Sent" : "Failed",
                    SentAt = sent ? DateTime.UtcNow : null
                };

                _context.NotificationLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending TaskAssigned notification: {ex.Message}");
            }
        }

        public async Task SendTaskCompletedNotificationAsync(TaskItem task, User completedByUser)
        {
            try
            {
                // Get template
                var template = await _context.NotificationTemplates
                    .FirstOrDefaultAsync(nt => nt.Name == "TaskCompleted" && nt.IsActive);

                if (template == null)
                    return;

                // Send to assigned user
                if (task.AssignedToUser?.Email != null)
                {
                    var prefs = await _context.NotificationPreferences
                        .FirstOrDefaultAsync(np => np.UserNumber == task.AssignedToUser.UserNumber);

                    if (prefs == null || prefs.TaskCompletedEmail)
                    {
                        var body = template.BodyTemplate
                            .Replace("{{TaskName}}", task.Name ?? "")
                            .Replace("{{CompletedBy}}", completedByUser?.FullName ?? "Unknown")
                            .Replace("{{CompletionDate}}", DateTime.UtcNow.ToString("MMM dd, yyyy HH:mm"));

                        var sent = await SendEmailAsync(task.AssignedToUser.Email, template.Subject, body);

                        var log = new NotificationLog
                        {
                            RecipientUserId = task.AssignedToUser.UserNumber,
                            RelatedTaskId = task.TaskItemId,
                            TemplateId = template.TemplateId,
                            Subject = template.Subject,
                            Body = body,
                            RecipientEmail = task.AssignedToUser.Email,
                            Status = sent ? "Sent" : "Failed",
                            SentAt = sent ? DateTime.UtcNow : null
                        };

                        _context.NotificationLogs.Add(log);
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending TaskCompleted notification: {ex.Message}");
            }
        }

        public async Task SendTaskDueSoonNotificationAsync(TaskItem task)
        {
            try
            {
                if (task.AssignedToUser?.Email == null || task.EndDate == null)
                    return;

                // Check user preferences
                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserNumber == task.AssignedToUser.UserNumber);

                if (prefs != null && !prefs.TaskDueSoonEmail)
                    return;

                // Get template
                var template = await _context.NotificationTemplates
                    .FirstOrDefaultAsync(nt => nt.Name == "TaskDueSoon" && nt.IsActive);

                if (template == null)
                    return;

                var daysUntilDue = (int)(task.EndDate.Value - DateTime.UtcNow).TotalDays;

                var body = template.BodyTemplate
                    .Replace("{{TaskName}}", task.Name ?? "")
                    .Replace("{{TaskDueDate}}", task.EndDate.Value.ToString("MMM dd, yyyy"))
                    .Replace("{{DaysUntilDue}}", daysUntilDue.ToString())
                    .Replace("{{TaskDescription}}", task.Description ?? "")
                    .Replace("{{AssignedUser}}", task.AssignedToUser?.FullName ?? "");

                var sent = await SendEmailAsync(task.AssignedToUser.Email, template.Subject, body);

                var log = new NotificationLog
                {
                    RecipientUserId = task.AssignedToUser.UserNumber,
                    RelatedTaskId = task.TaskItemId,
                    TemplateId = template.TemplateId,
                    Subject = template.Subject,
                    Body = body,
                    RecipientEmail = task.AssignedToUser.Email,
                    Status = sent ? "Sent" : "Failed",
                    SentAt = sent ? DateTime.UtcNow : null
                };

                _context.NotificationLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending TaskDueSoon notification: {ex.Message}");
            }
        }

        public async Task SendTaskStatusChangedNotificationAsync(TaskItem task, User changedByUser, string oldStatus)
        {
            try
            {
                if (task.AssignedToUser?.Email == null)
                    return;

                // Check user preferences
                var prefs = await _context.NotificationPreferences
                    .FirstOrDefaultAsync(np => np.UserNumber == task.AssignedToUser.UserNumber);

                if (prefs != null && !prefs.TaskStatusChangeEmail)
                    return;

                // Get template
                var template = await _context.NotificationTemplates
                    .FirstOrDefaultAsync(nt => nt.Name == "TaskStatusChanged" && nt.IsActive);

                if (template == null)
                    return;

                var body = template.BodyTemplate
                    .Replace("{{TaskName}}", task.Name ?? "")
                    .Replace("{{OldStatus}}", oldStatus ?? "Unknown")
                    .Replace("{{NewStatus}}", task.Status ?? "")
                    .Replace("{{ChangedBy}}", changedByUser?.FullName ?? "Unknown")
                    .Replace("{{ChangeDate}}", DateTime.UtcNow.ToString("MMM dd, yyyy HH:mm"));

                var sent = await SendEmailAsync(task.AssignedToUser.Email, template.Subject, body);

                var log = new NotificationLog
                {
                    RecipientUserId = task.AssignedToUser.UserNumber,
                    RelatedTaskId = task.TaskItemId,
                    TemplateId = template.TemplateId,
                    Subject = template.Subject,
                    Body = body,
                    RecipientEmail = task.AssignedToUser.Email,
                    Status = sent ? "Sent" : "Failed",
                    SentAt = sent ? DateTime.UtcNow : null
                };

                _context.NotificationLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending TaskStatusChanged notification: {ex.Message}");
            }
        }

        public async Task SendTaskStatusChangedToAdminsAsync(TaskItem task, User? changedByUser, string oldStatus)
        {
            try
            {
                var template = await GetOrCreateTemplateAsync(
                    "TaskStatusChangedAdmin",
                    "Task status changed: {{TaskName}}",
                    "<p><strong>{{ChangedBy}}</strong> changed <strong>{{TaskName}}</strong> from <strong>{{OldStatus}}</strong> to <strong>{{NewStatus}}</strong>.</p><p>Member email: {{ChangedByEmail}}</p><p>Changed at: {{ChangeDate}}</p><p>{{TaskDescription}}</p>");

                var body = template.BodyTemplate
                    .Replace("{{TaskName}}", task.Name ?? "")
                    .Replace("{{OldStatus}}", oldStatus ?? "Unknown")
                    .Replace("{{NewStatus}}", task.Status ?? "")
                    .Replace("{{ChangedBy}}", changedByUser?.FullName ?? "Unknown")
                    .Replace("{{ChangedByEmail}}", changedByUser?.Email ?? "Not configured")
                    .Replace("{{ChangeDate}}", DateTime.UtcNow.ToString("MMM dd, yyyy HH:mm"))
                    .Replace("{{TaskDescription}}", task.Description ?? "");
                body = AddMemberEmailIfMissing(body, "Member email", changedByUser?.Email);

                var subject = template.Subject.Replace("{{TaskName}}", task.Name ?? "");

                await SendToAdminsAsync(template, task, subject, body, checkStatusChangePreference: true, replyToEmail: changedByUser?.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending admin TaskStatusChanged notification: {ex.Message}");
            }
        }

        public async Task SendTaskNoteToAdminsAsync(TaskItem task, User? sender, string note)
        {
            try
            {
                var template = await GetOrCreateTemplateAsync(
                    "TaskNoteToAdmin",
                    "Task note from {{SenderName}}: {{TaskName}}",
                    "<p><strong>{{SenderName}}</strong> sent a note about <strong>{{TaskName}}</strong>.</p><p>Member email: {{SenderEmail}}</p><p>{{Note}}</p><p>Status: {{TaskStatus}}</p>");

                var body = template.BodyTemplate
                    .Replace("{{SenderName}}", sender?.FullName ?? "Unknown")
                    .Replace("{{SenderEmail}}", sender?.Email ?? "Not configured")
                    .Replace("{{TaskName}}", task.Name ?? "")
                    .Replace("{{Note}}", WebUtility.HtmlEncode(note))
                    .Replace("{{TaskStatus}}", task.Status ?? "");
                body = AddMemberEmailIfMissing(body, "Member email", sender?.Email);

                var subject = template.Subject
                    .Replace("{{SenderName}}", sender?.FullName ?? "Unknown")
                    .Replace("{{TaskName}}", task.Name ?? "");

                await SendToAdminsAsync(template, task, subject, body, checkStatusChangePreference: false, replyToEmail: sender?.Email);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending task note to admins: {ex.Message}");
            }
        }

        private async Task<NotificationTemplate> GetOrCreateTemplateAsync(string name, string subject, string bodyTemplate)
        {
            var template = await _context.NotificationTemplates
                .FirstOrDefaultAsync(nt => nt.Name == name && nt.IsActive);

            if (template != null)
                return template;

            template = new NotificationTemplate
            {
                Name = name,
                Subject = subject,
                BodyTemplate = bodyTemplate,
                IsActive = true
            };

            _context.NotificationTemplates.Add(template);
            await _context.SaveChangesAsync();
            return template;
        }

        private async Task SendToAdminsAsync(NotificationTemplate template, TaskItem task, string subject, string body, bool checkStatusChangePreference, string? replyToEmail)
        {
            var admins = await _context.Users
                .Where(u => u.IsAdmin && u.IsActive)
                .ToListAsync();

            var recipients = admins
                .Select(admin => new AdminRecipient(admin, admin.Email))
                .Where(recipient => !string.IsNullOrWhiteSpace(recipient.Email))
                .ToList();

            var configuredAdminEmail = _configuration["Email:AdminEmail"];
            if (!string.IsNullOrWhiteSpace(configuredAdminEmail)
                && admins.Count > 0
                && !recipients.Any(r => string.Equals(r.Email, configuredAdminEmail, StringComparison.OrdinalIgnoreCase)))
            {
                recipients.Add(new AdminRecipient(admins[0], configuredAdminEmail));
            }

            if (recipients.Count == 0)
            {
                _logger.LogWarning("No admin email recipients configured");
                return;
            }

            var filteredRecipients = new List<AdminRecipient>();
            foreach (var recipient in recipients)
            {
                if (checkStatusChangePreference)
                {
                    var prefs = await _context.NotificationPreferences
                        .FirstOrDefaultAsync(np => np.UserNumber == recipient.Admin.UserNumber);

                    if (prefs != null && !prefs.TaskStatusChangeEmail)
                        continue;
                }

                filteredRecipients.Add(recipient);
            }

            if (filteredRecipients.Count == 0)
                return;

            var recipientEmails = filteredRecipients.Select(r => r.Email!).ToList();

            var sent = await SendEmailAsync(string.Join(",", recipientEmails), subject, body, replyToEmail: replyToEmail);
            var errorMessage = sent ? string.Empty : "Email service is not configured or delivery failed.";

            foreach (var recipient in filteredRecipients)
            {
                _context.NotificationLogs.Add(new NotificationLog
                {
                    RecipientUserId = recipient.Admin.UserNumber,
                    RelatedTaskId = task.TaskItemId,
                    TemplateId = template.TemplateId,
                    Subject = subject,
                    Body = body,
                    RecipientEmail = recipient.Email!,
                    Status = sent ? "Sent" : "Failed",
                    SentAt = sent ? DateTime.UtcNow : null,
                    ErrorMessage = sent ? string.Empty : errorMessage
                });
            }

            await _context.SaveChangesAsync();
        }

        private static string AddMemberEmailIfMissing(string body, string label, string? email)
        {
            if (string.IsNullOrWhiteSpace(email) || body.Contains(email, StringComparison.OrdinalIgnoreCase))
                return body;

            return $"{body}<p>{label}: {WebUtility.HtmlEncode(email)}</p>";
        }

        private sealed record AdminRecipient(User Admin, string? Email);
    }
}
