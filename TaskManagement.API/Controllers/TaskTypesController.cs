using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskTypesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TaskTypesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskType>>> GetTaskTypes()
        {
            return await _context.TaskTypes.AsNoTracking().OrderBy(t => t.Name).ToListAsync();
        }
    }
}
