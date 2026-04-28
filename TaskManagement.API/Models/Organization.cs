namespace TaskManagement.API.Models
{
    public class Organization
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public ICollection<Portfolio>? Portfolios { get; set; }
    }
}
