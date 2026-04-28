using Microsoft.EntityFrameworkCore.Migrations;

namespace TaskManagement.API.Migrations
{
    public partial class AddProjectTemplateTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectTemplates",
                columns: table => new
                {
                    TemplateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    UsageCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTemplates", x => x.TemplateId);
                    table.ForeignKey(
                        name: "FK_ProjectTemplates_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "UserNumber",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TemplateTasks",
                columns: table => new
                {
                    TemplateTaskId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TemplateId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    StartDateOffsetDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DurationDays = table.Column<int>(type: "int", nullable: false, defaultValue: 5),
                    Priority = table.Column<string>(type: "nvarchar(20)", nullable: false, defaultValue: "Medium"),
                    Status = table.Column<string>(type: "nvarchar(20)", nullable: false, defaultValue: "Not Started"),
                    PredecessorTemplateTaskId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateTasks", x => x.TemplateTaskId);
                    table.ForeignKey(
                        name: "FK_TemplateTasks_ProjectTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "ProjectTemplates",
                        principalColumn: "TemplateId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TemplateTasks_TemplateTasks_PredecessorTemplateTaskId",
                        column: x => x.PredecessorTemplateTaskId,
                        principalTable: "TemplateTasks",
                        principalColumn: "TemplateTaskId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTemplates_CreatedByUserId",
                table: "ProjectTemplates",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTemplates_IsPublic",
                table: "ProjectTemplates",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateTasks_PredecessorTemplateTaskId",
                table: "TemplateTasks",
                column: "PredecessorTemplateTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateTasks_TemplateId_OrderIndex",
                table: "TemplateTasks",
                columns: new[] { "TemplateId", "OrderIndex" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TemplateTasks");

            migrationBuilder.DropTable(
                name: "ProjectTemplates");
        }
    }
}
