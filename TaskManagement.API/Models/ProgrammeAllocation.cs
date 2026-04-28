namespace TaskManagement.API.Models
{
    /// <summary>
    /// Association Class: Programme Resource Allocation
    /// Maps resources allocated to a specific Programme
    /// </summary>
    public class ProgrammeAllocation
    {
        public int ProgrammeId { get; set; }
        public Programme? Programme { get; set; }

        public int ResourceId { get; set; }
        public Resource? Resource { get; set; }

        public decimal MaxAllocatedUnits { get; set; }
    }
}
