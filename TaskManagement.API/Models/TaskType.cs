namespace TaskManagement.API.Models
{
    public class TaskType
    {
        public int TaskTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
