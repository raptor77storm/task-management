using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResourcesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ResourcesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Resource>>> GetResources()
        {
            return await _context.Resources.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Resource>> GetResource(int id)
        {
            var resource = await _context.Resources.FindAsync(id);

            if (resource == null)
                return NotFound();

            return resource;
        }

        [HttpPost]
        public async Task<ActionResult<Resource>> CreateResource(Resource resource)
        {
            _context.Resources.Add(resource);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetResource), new { id = resource.ResourceId }, resource);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateResource(int id, Resource resource)
        {
            if (id != resource.ResourceId)
                return BadRequest();

            _context.Entry(resource).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResource(int id)
        {
            var resource = await _context.Resources.FindAsync(id);

            if (resource == null)
                return NotFound();

            _context.Resources.Remove(resource);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
