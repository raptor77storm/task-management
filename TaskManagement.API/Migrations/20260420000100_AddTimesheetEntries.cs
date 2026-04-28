using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TaskManagement.API.Data;

#nullable disable

namespace TaskManagement.API.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260420000100_AddTimesheetEntries")]
    public partial class AddTimesheetEntries : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TimesheetEntries",
                columns: table => new
                {
                    TimesheetEntryId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TaskId = table.Column<int>(type: "int", nullable: false),
                    UserNumber = table.Column<int>(type: "int", nullable: false),
                    WorkDate = table.Column<DateTime>(type: "date", nullable: false),
                    Hours = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimesheetEntries", x => x.TimesheetEntryId);
                    table.ForeignKey(
                        name: "FK_TimesheetEntries_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "TaskItemId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TimesheetEntries_Users_UserNumber",
                        column: x => x.UserNumber,
                        principalTable: "Users",
                        principalColumn: "UserNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TimesheetEntries_TaskId",
                table: "TimesheetEntries",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TimesheetEntries_UserNumber_TaskId_WorkDate",
                table: "TimesheetEntries",
                columns: new[] { "UserNumber", "TaskId", "WorkDate" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TimesheetEntries");
        }
    }
}
