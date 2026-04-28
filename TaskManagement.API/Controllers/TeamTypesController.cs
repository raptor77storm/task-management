using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TeamTypesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamType>>> GetTeamTypes()
        {
            return await _context.TeamTypes.AsNoTracking().OrderBy(t => t.Name).ToListAsync();
        }
    }
}
