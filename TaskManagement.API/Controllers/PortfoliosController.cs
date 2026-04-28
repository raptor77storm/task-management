using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagement.API.Data;
using TaskManagement.API.Models;

namespace TaskManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PortfoliosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PortfoliosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Portfolio>>> GetPortfolios()
        {
            return await _context.Portfolios.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Portfolio>> GetPortfolio(int id)
        {
            var portfolio = await _context.Portfolios.FindAsync(id);

            if (portfolio == null)
                return NotFound();

            return portfolio;
        }

        [HttpGet("organization/{orgId}")]
        public async Task<ActionResult<IEnumerable<Portfolio>>> GetPortfoliosByOrganization(int orgId)
        {
            var portfolios = await _context.Portfolios
                .Where(p => p.OrganizationId == orgId)
                .ToListAsync();

            return portfolios;
        }

        [HttpPost]
        public async Task<ActionResult<Portfolio>> CreatePortfolio(Portfolio portfolio)
        {
            _context.Portfolios.Add(portfolio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPortfolio), new { id = portfolio.Id }, portfolio);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePortfolio(int id, Portfolio portfolio)
        {
            if (id != portfolio.Id)
                return BadRequest();

            _context.Entry(portfolio).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePortfolio(int id)
        {
            var portfolio = await _context.Portfolios.FindAsync(id);

            if (portfolio == null)
                return NotFound();

            _context.Portfolios.Remove(portfolio);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
