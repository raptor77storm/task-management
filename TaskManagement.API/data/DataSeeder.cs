using TaskManagement.API.Models;
using TaskManagement.API.Services;

namespace TaskManagement.API.Data
{
    public class DataSeeder
    {
        public static void SeedData(AppDbContext context)
        {
            EnsureReferenceData(context);
            EnsureInitialAdmin(context);
        }

        private static void EnsureReferenceData(AppDbContext context)
        {
            if (!context.TeamTypes.Any())
            {
                context.TeamTypes.AddRange(
                    new TeamType { Name = "Developer", Description = "Software development team" },
                    new TeamType { Name = "Technical", Description = "Technical and infrastructure team" },
                    new TeamType { Name = "Functional", Description = "Business and functional team" });
                context.SaveChanges();
            }

            if (!context.TaskTypes.Any())
            {
                context.TaskTypes.AddRange(
                    new TaskType { Name = "Development", Description = "Development work" },
                    new TaskType { Name = "Technical", Description = "Technical task" },
                    new TaskType { Name = "Functional", Description = "Functional task" });
                context.SaveChanges();
            }
        }

        private static void EnsureInitialAdmin(AppDbContext context)
        {
            var passwordService = new PasswordService();
            var functionalTeamType = context.TeamTypes.FirstOrDefault(t => t.Name == "Functional");
            var admin = context.Users.FirstOrDefault(u => u.Username == "mchebbo");

            if (admin == null)
            {
                admin = new User
                {
                    SSN = "ADMIN-MCHEBBO",
                    Username = "mchebbo"
                };
                context.Users.Add(admin);
            }

            admin.SSN = "ADMIN-MCHEBBO";
            admin.FirstName = "mohamed";
            admin.LastName = "chebbo";
            admin.MiddleInitial = null;
            admin.Roles = "Admin";
            admin.Email = null;
            admin.TeamType = functionalTeamType;
            admin.PasswordHash = passwordService.HashPassword("p@ssw0rd");
            admin.IsAdmin = true;
            admin.IsActive = true;
            admin.MustChangePasswordOnFirstLogin = false;
            admin.LastLoginAt = null;

            var usersToRemove = context.Users
                .Where(u => u.Username != "mchebbo")
                .ToList();

            if (usersToRemove.Count > 0)
            {
                foreach (var user in usersToRemove)
                {
                    user.IsActive = false;
                }
            }

            context.SaveChanges();
        }
    }
}
