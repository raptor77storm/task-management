namespace TaskManagement.API.Models
{
    /// <summary>
    /// Association Class: User Resource Allocation
    /// Maps resources (typically work resources) allocated to users
    /// </summary>
    public class ResourceAllocation
    {
        public int UserNumber { get; set; }
        public User? User { get; set; }

        public int ResourceId { get; set; }
        public Resource? Resource { get; set; }

        public decimal AllocatedUnits { get; set; }
    }
}
