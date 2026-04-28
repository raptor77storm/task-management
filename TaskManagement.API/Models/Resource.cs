namespace TaskManagement.API.Models
{
    public class Resource
    {
        public int ResourceId { get; set; }
        public string Designation { get; set; } = string.Empty;
        public string ResourceType { get; set; } = string.Empty; // "Work" or "Material"
        public decimal MaxUnits { get; set; }
        public decimal UnitCost { get; set; }

        public ICollection<Requirement>? Requirements { get; set; }
        public ICollection<ProgrammeAllocation>? ProgrammeAllocations { get; set; }
        public ICollection<ResourceAllocation>? UserAllocations { get; set; }
    }
}
