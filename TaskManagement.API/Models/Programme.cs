namespace TaskManagement.API.Models
{
    public class Programme
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public int PortfolioId { get; set; }
        public Portfolio? Portfolio { get; set; }

        public ICollection<Project>? Projects { get; set; }
        public ICollection<ProgrammeAllocation>? ResourceAllocations { get; set; }
    }
}
