namespace TaskManagement.API.Models
{
    public class Portfolio
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public ICollection<Programme>? Programmes { get; set; }
    }
}
