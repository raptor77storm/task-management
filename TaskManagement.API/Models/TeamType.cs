namespace TaskManagement.API.Models
{
    public class TeamType
    {
        public int TeamTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
