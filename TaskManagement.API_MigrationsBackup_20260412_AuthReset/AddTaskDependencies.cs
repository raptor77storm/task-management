using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskDependencies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Tasks_PredecessorTaskId",
                table: "Tasks",
                column: "PredecessorTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ProjectId_PredecessorTaskId",
                table: "Tasks",
                columns: new[] { "ProjectId", "PredecessorTaskId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Tasks_PredecessorTaskId",
                table: "Tasks",
                column: "PredecessorTaskId",
                principalTable: "Tasks",
                principalColumn: "TaskItemId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Tasks_PredecessorTaskId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_PredecessorTaskId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_ProjectId_PredecessorTaskId",
                table: "Tasks");
        }
    }
}
