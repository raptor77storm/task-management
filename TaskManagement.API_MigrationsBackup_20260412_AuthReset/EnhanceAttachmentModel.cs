using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceAttachmentModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FileName",
                table: "Attachments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FileType",
                table: "Attachments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "FileSize",
                table: "Attachments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<int>(
                name: "UploadedByUserId",
                table: "Attachments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UploadedAt",
                table: "Attachments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_UploadedByUserId",
                table: "Attachments",
                column: "UploadedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Users_UploadedByUserId",
                table: "Attachments",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "UserNumber",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Users_UploadedByUserId",
                table: "Attachments");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_UploadedByUserId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "FileName",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "FileType",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "FileSize",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "UploadedByUserId",
                table: "Attachments");

            migrationBuilder.DropColumn(
                name: "UploadedAt",
                table: "Attachments");
        }
    }
}
