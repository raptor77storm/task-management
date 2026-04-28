using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class CleanDeploymentData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM [NotificationLogs];
                DELETE FROM [NotificationPreferences];
                DELETE FROM [AuditLogs];
                DELETE FROM [TimesheetEntries];
                DELETE FROM [Attachments];
                DELETE FROM [Progress];
                DELETE FROM [Requirements];
                DELETE FROM [ResourceAllocations];
                DELETE FROM [ProgrammeAllocations];
                DELETE FROM [TemplateTasks];
                DELETE FROM [ProjectTemplates];

                UPDATE [Tasks] SET [ParentTaskId] = NULL, [PredecessorTaskId] = NULL;
                DELETE FROM [Tasks];
                DELETE FROM [Projects];
                DELETE FROM [Programmes];
                DELETE FROM [Portfolios];
                DELETE FROM [Organizations];
                DELETE FROM [Resources];
                DELETE FROM [Users];

                DBCC CHECKIDENT ('[Users]', RESEED, 0);
                DBCC CHECKIDENT ('[Resources]', RESEED, 0);
                DBCC CHECKIDENT ('[Organizations]', RESEED, 0);
                DBCC CHECKIDENT ('[Portfolios]', RESEED, 0);
                DBCC CHECKIDENT ('[Programmes]', RESEED, 0);
                DBCC CHECKIDENT ('[Projects]', RESEED, 0);
                DBCC CHECKIDENT ('[Tasks]', RESEED, 0);

                SET IDENTITY_INSERT [Users] ON;
                INSERT INTO [Users]
                    ([UserNumber], [SSN], [FirstName], [LastName], [MiddleInitial], [Roles], [Username], [PasswordHash], [IsAdmin], [IsActive], [LastLoginAt], [MustChangePasswordOnFirstLogin], [Email], [TeamTypeId])
                VALUES
                    (1, N'ADMIN-MCHEBBO', N'mohamed', N'chebbo', NULL, N'Admin', N'mchebbo', N'AQIDBAUGBwgJCgsMDQ4PENLMAzD+BuL22WYYF0YRl/m9BCeG', 1, 1, NULL, 0, NULL, NULL);
                SET IDENTITY_INSERT [Users] OFF;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
