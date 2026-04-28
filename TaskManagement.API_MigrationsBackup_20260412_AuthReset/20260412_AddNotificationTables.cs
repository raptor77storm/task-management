using Microsoft.EntityFrameworkCore.Migrations;

namespace TaskManagement.API.Migrations
{
    public partial class AddNotificationTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationTemplates",
                columns: table => new
                {
                    TemplateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    BodyTemplate = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTemplates", x => x.TemplateId);
                });

            migrationBuilder.CreateTable(
                name: "NotificationLogs",
                columns: table => new
                {
                    LogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecipientUserId = table.Column<int>(type: "int", nullable: false),
                    RelatedTaskId = table.Column<int>(type: "int", nullable: true),
                    TemplateId = table.Column<int>(type: "int", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecipientEmail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", nullable: false, defaultValue: "Pending"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ErrorMessage = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RetryCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    MaxRetries = table.Column<int>(type: "int", nullable: false, defaultValue: 3)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationLogs", x => x.LogId);
                    table.ForeignKey(
                        name: "FK_NotificationLogs_NotificationTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "NotificationTemplates",
                        principalColumn: "TemplateId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_NotificationLogs_Tasks_RelatedTaskId",
                        column: x => x.RelatedTaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskItemId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NotificationLogs_Users_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalTable: "Users",
                        principalColumn: "UserNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificationPreferences",
                columns: table => new
                {
                    PreferenceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserNumber = table.Column<int>(type: "int", nullable: false),
                    TaskAssignedEmail = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    TaskCompletedEmail = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    TaskDueSoonEmail = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    TaskStatusChangeEmail = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DailyDigestEmail = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DigestTime = table.Column<string>(type: "nvarchar(10)", nullable: false, defaultValue: "09:00"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationPreferences", x => x.PreferenceId);
                    table.ForeignKey(
                        name: "FK_NotificationPreferences_Users_UserNumber",
                        column: x => x.UserNumber,
                        principalTable: "Users",
                        principalColumn: "UserNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_RecipientUserId",
                table: "NotificationLogs",
                column: "RecipientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_RelatedTaskId",
                table: "NotificationLogs",
                column: "RelatedTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_TemplateId",
                table: "NotificationLogs",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationLogs_Status_CreatedAt",
                table: "NotificationLogs",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPreferences_UserNumber",
                table: "NotificationPreferences",
                column: "UserNumber");

            // Seed default notification templates
            migrationBuilder.InsertData(
                table: "NotificationTemplates",
                columns: new[] { "Name", "Subject", "BodyTemplate", "IsActive", "CreatedAt" },
                values: new object[,]
                {
                    {
                        "TaskAssigned",
                        "New Task Assigned: {{TaskName}}",
                        "<h2>You have been assigned a new task</h2><p><strong>{{TaskName}}</strong></p><p>{{TaskDescription}}</p><p><strong>Due:</strong> {{TaskDueDate}}</p><p><strong>Priority:</strong> {{Priority}}</p>",
                        true,
                        DateTime.UtcNow
                    },
                    {
                        "TaskCompleted",
                        "Task Completed: {{TaskName}}",
                        "<h2>Task completed successfully</h2><p><strong>{{TaskName}}</strong> has been marked as completed.</p><p><strong>Completed by:</strong> {{CompletedBy}}</p><p><strong>Completion Date:</strong> {{CompletionDate}}</p>",
                        true,
                        DateTime.UtcNow
                    },
                    {
                        "TaskDueSoon",
                        "Task Due Soon: {{TaskName}}",
                        "<h2>Reminder: Task due soon</h2><p><strong>{{TaskName}}</strong> is due on {{TaskDueDate}} (in {{DaysUntilDue}} days).</p><p>{{TaskDescription}}</p><p><strong>Assigned to:</strong> {{AssignedUser}}</p>",
                        true,
                        DateTime.UtcNow
                    },
                    {
                        "TaskStatusChanged",
                        "Task Status Changed: {{TaskName}}",
                        "<h2>Task status has been updated</h2><p><strong>{{TaskName}}</strong></p><p><strong>Old Status:</strong> {{OldStatus}}</p><p><strong>New Status:</strong> {{NewStatus}}</p><p><strong>Changed by:</strong> {{ChangedBy}}</p><p><strong>Change Date:</strong> {{ChangeDate}}</p>",
                        true,
                        DateTime.UtcNow
                    }
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable("NotificationLogs");
            migrationBuilder.DropTable("NotificationPreferences");
            migrationBuilder.DropTable("NotificationTemplates");
        }
    }
}
