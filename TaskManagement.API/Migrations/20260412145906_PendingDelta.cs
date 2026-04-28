using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class PendingDelta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Users_UploadedByUserId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_TemplateTasks_TemplateTasks_PredecessorTemplateTaskId",
                table: "TemplateTasks");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Users_UploadedByUserId",
                table: "Attachments",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "UserNumber",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TemplateTasks_TemplateTasks_PredecessorTemplateTaskId",
                table: "TemplateTasks",
                column: "PredecessorTemplateTaskId",
                principalTable: "TemplateTasks",
                principalColumn: "TemplateTaskId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Users_UploadedByUserId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_TemplateTasks_TemplateTasks_PredecessorTemplateTaskId",
                table: "TemplateTasks");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Users_UploadedByUserId",
                table: "Attachments",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "UserNumber");

            migrationBuilder.AddForeignKey(
                name: "FK_TemplateTasks_TemplateTasks_PredecessorTemplateTaskId",
                table: "TemplateTasks",
                column: "PredecessorTemplateTaskId",
                principalTable: "TemplateTasks",
                principalColumn: "TemplateTaskId",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
