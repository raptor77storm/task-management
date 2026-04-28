using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Models;

namespace TaskManagement.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Hierarchy
        public DbSet<Organization> Organizations { get; set; }
        public DbSet<Portfolio> Portfolios { get; set; }
        public DbSet<Programme> Programmes { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<TaskType> TaskTypes { get; set; }

        // Identity and Access
        public DbSet<User> Users { get; set; }
        public DbSet<TeamType> TeamTypes { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        // Resources
        public DbSet<Resource> Resources { get; set; }
        public DbSet<ProgrammeAllocation> ProgrammeAllocations { get; set; }
        public DbSet<Requirement> Requirements { get; set; }
        public DbSet<ResourceAllocation> ResourceAllocations { get; set; }

        // Task Metadata
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Progress> Progress { get; set; }
        public DbSet<TimesheetEntry> TimesheetEntries { get; set; }

        // Templates
        public DbSet<ProjectTemplate> ProjectTemplates { get; set; }
        public DbSet<TemplateTask> TemplateTasks { get; set; }

        // Notifications
        public DbSet<NotificationTemplate> NotificationTemplates { get; set; }
        public DbSet<NotificationLog> NotificationLogs { get; set; }
        public DbSet<NotificationPreference> NotificationPreferences { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ===== USER PRIMARY KEY =====
            modelBuilder.Entity<User>()
                .HasKey(u => u.UserNumber);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.SSN)
                .IsUnique();

            modelBuilder.Entity<User>()
                .Property(u => u.Username)
                .HasMaxLength(100);

            modelBuilder.Entity<User>()
                .Property(u => u.Email)
                .HasMaxLength(255);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasOne(u => u.TeamType)
                .WithMany()
                .HasForeignKey(u => u.TeamTypeId)
                .OnDelete(DeleteBehavior.SetNull);
            // Organization 1:N Portfolio
            modelBuilder.Entity<Portfolio>()
                .HasOne(p => p.Organization)
                .WithMany(o => o.Portfolios)
                .HasForeignKey(p => p.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Portfolio 1:N Programme
            modelBuilder.Entity<Programme>()
                .HasOne(p => p.Portfolio)
                .WithMany(p => p.Programmes)
                .HasForeignKey(p => p.PortfolioId)
                .OnDelete(DeleteBehavior.Cascade);

            // Programme 1:N Project
            modelBuilder.Entity<Project>()
                .HasOne(p => p.Programme)
                .WithMany(p => p.Projects)
                .HasForeignKey(p => p.ProgrammeId)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== TASK RELATIONSHIPS =====
            // Project 1:N Task
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskItem 1:N SubTasks (Includes: Composition - child cannot exist without parent)
            // Use NoAction to avoid cascade cycle with ProjectId relationship
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.ParentTask)
                .WithMany(t => t.SubTasks)
                .HasForeignKey(t => t.ParentTaskId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.TaskType)
                .WithMany()
                .HasForeignKey(t => t.TaskTypeId)
                .OnDelete(DeleteBehavior.SetNull);

            // TaskItem 1:N DependentTasks (Task Dependencies for critical path)
            // A task can have multiple successors through PredecessorTaskId
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.PredecessorTask)
                .WithMany(t => t.DependentTasks)
                .HasForeignKey(t => t.PredecessorTaskId)
                .OnDelete(DeleteBehavior.NoAction);

            // Index for efficient critical path queries
            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => new { t.ProjectId, t.PredecessorTaskId });

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.PredecessorTaskId);

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.OverheadCosts)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.BudgetAtCompletion)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.PlannedWorkPercentage)
                .HasColumnType("decimal(18,2)");

            // ===== ASSIGNMENT =====
            // User 1:N TaskItem (AssignedToUser)
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // ===== WEAK ENTITY: ATTACHMENTS =====
            // TaskItem 1:N Attachment (Existence dependency)
            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.Task)
                .WithMany(t => t.Attachments)
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // User 1:N Attachment (UploadedByUser)
            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.UploadedByUser)
                .WithMany()
                .HasForeignKey(a => a.UploadedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // ===== PROGRESS SNAPSHOTS =====
            // TaskItem 1:N Progress
            modelBuilder.Entity<Progress>()
                .HasOne(p => p.Task)
                .WithMany(t => t.ProgressSnapshots)
                .HasForeignKey(p => p.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Progress>()
                .Property(p => p.tWP)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Progress>()
                .Property(p => p.cWP)
                .HasColumnType("decimal(18,2)");

            // ===== TIMESHEETS =====
            modelBuilder.Entity<TimesheetEntry>()
                .HasOne(te => te.Task)
                .WithMany(t => t.TimesheetEntries)
                .HasForeignKey(te => te.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TimesheetEntry>()
                .HasOne(te => te.User)
                .WithMany(u => u.TimesheetEntries)
                .HasForeignKey(te => te.UserNumber)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TimesheetEntry>()
                .Property(te => te.Hours)
                .HasColumnType("decimal(5,2)");

            modelBuilder.Entity<TimesheetEntry>()
                .Property(te => te.WorkDate)
                .HasColumnType("date");

            modelBuilder.Entity<TimesheetEntry>()
                .Property(te => te.Notes)
                .HasMaxLength(1000);

            modelBuilder.Entity<TimesheetEntry>()
                .HasIndex(te => new { te.UserNumber, te.TaskId, te.WorkDate });

            // ===== ASSOCIATION CLASSES =====
            // Programme M:N Resource via ProgrammeAllocation
            modelBuilder.Entity<ProgrammeAllocation>()
                .HasKey(pa => new { pa.ProgrammeId, pa.ResourceId });

            modelBuilder.Entity<ProgrammeAllocation>()
                .Property(pa => pa.MaxAllocatedUnits)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<ProgrammeAllocation>()
                .HasOne(pa => pa.Programme)
                .WithMany(p => p.ResourceAllocations)
                .HasForeignKey(pa => pa.ProgrammeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProgrammeAllocation>()
                .HasOne(pa => pa.Resource)
                .WithMany(r => r.ProgrammeAllocations)
                .HasForeignKey(pa => pa.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Task M:N Resource via Requirement
            modelBuilder.Entity<Requirement>()
                .HasKey(r => new { r.TaskId, r.ResourceId });

            modelBuilder.Entity<Requirement>()
                .Property(r => r.TotalRequirement)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Requirement>()
                .HasOne(r => r.Task)
                .WithMany(t => t.Requirements)
                .HasForeignKey(r => r.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Requirement>()
                .HasOne(r => r.Resource)
                .WithMany(r => r.Requirements)
                .HasForeignKey(r => r.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);

            // User M:N Resource via ResourceAllocation
            modelBuilder.Entity<ResourceAllocation>()
                .HasKey(ra => new { ra.UserNumber, ra.ResourceId });

            modelBuilder.Entity<ResourceAllocation>()
                .Property(ra => ra.AllocatedUnits)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Resource>()
                .Property(r => r.MaxUnits)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Resource>()
                .Property(r => r.UnitCost)
                .HasColumnType("decimal(18,2)");

            modelBuilder.Entity<ResourceAllocation>()
                .HasOne(ra => ra.User)
                .WithMany(u => u.Allocations)
                .HasForeignKey(ra => ra.UserNumber)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ResourceAllocation>()
                .HasOne(ra => ra.Resource)
                .WithMany(r => r.UserAllocations)
                .HasForeignKey(ra => ra.ResourceId)
                .OnDelete(DeleteBehavior.Cascade);

            // ===== PROJECT TEMPLATES =====
            // ProjectTemplate 1:N TemplateTask
            modelBuilder.Entity<TemplateTask>()
                .HasOne(tt => tt.ProjectTemplate)
                .WithMany(pt => pt.TemplateTasks)
                .HasForeignKey(tt => tt.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            // TemplateTask 1:N PredecessorTemplateTask (Task Dependencies in template)
            modelBuilder.Entity<TemplateTask>()
                .HasOne(tt => tt.PredecessorTemplateTask)
                .WithMany()
                .HasForeignKey(tt => tt.PredecessorTemplateTaskId)
                .OnDelete(DeleteBehavior.NoAction);

            // User 1:N ProjectTemplate (CreatedByUser)
            modelBuilder.Entity<ProjectTemplate>()
                .HasOne(pt => pt.CreatedByUser)
                .WithMany()
                .HasForeignKey(pt => pt.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ===== NOTIFICATIONS =====
            // NotificationLog relationships
            modelBuilder.Entity<NotificationLog>()
                .HasOne(nl => nl.RecipientUser)
                .WithMany()
                .HasForeignKey(nl => nl.RecipientUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NotificationLog>()
                .HasOne(nl => nl.RelatedTask)
                .WithMany()
                .HasForeignKey(nl => nl.RelatedTaskId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<NotificationLog>()
                .HasOne(nl => nl.Template)
                .WithMany()
                .HasForeignKey(nl => nl.TemplateId)
                .OnDelete(DeleteBehavior.Restrict);

            // NotificationPreference (User 1:1 or 1:N)
            modelBuilder.Entity<NotificationPreference>()
                .HasOne(np => np.User)
                .WithMany()
                .HasForeignKey(np => np.UserNumber)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
