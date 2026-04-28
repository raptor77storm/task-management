using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamAndTaskTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeamTypeId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TaskTypeId",
                table: "Tasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TaskTypes",
                columns: table => new
                {
                    TaskTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTypes", x => x.TaskTypeId);
                });

            migrationBuilder.CreateTable(
                name: "TeamTypes",
                columns: table => new
                {
                    TeamTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamTypes", x => x.TeamTypeId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_TeamTypeId",
                table: "Users",
                column: "TeamTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TaskTypeId",
                table: "Tasks",
                column: "TaskTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_TaskTypes_TaskTypeId",
                table: "Tasks",
                column: "TaskTypeId",
                principalTable: "TaskTypes",
                principalColumn: "TaskTypeId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_TeamTypes_TeamTypeId",
                table: "Users",
                column: "TeamTypeId",
                principalTable: "TeamTypes",
                principalColumn: "TeamTypeId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_TaskTypes_TaskTypeId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_TeamTypes_TeamTypeId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "TaskTypes");

            migrationBuilder.DropTable(
                name: "TeamTypes");

            migrationBuilder.DropIndex(
                name: "IX_Users_TeamTypeId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_TaskTypeId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TeamTypeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TaskTypeId",
                table: "Tasks");
        }
    }
}
