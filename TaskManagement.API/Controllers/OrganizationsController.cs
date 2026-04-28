using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrganizationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Organization>>> GetOrganizations()
        {
            return await _context.Organizations.Include(o => o.Portfolios).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Organization>> CreateOrganization(Organization org)
        {
            _context.Organizations.Add(org);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOrganizations), new { id = org.Id }, org);
        }
    }
}
