using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProgrammesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProgrammesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Programme>>> GetProgrammes()
        {
            return await _context.Programmes.Include(p => p.Projects).ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Programme>> CreateProgramme(Programme programme)
        {
            _context.Programmes.Add(programme);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProgrammes), new { id = programme.Id }, programme);
        }
    }
}
