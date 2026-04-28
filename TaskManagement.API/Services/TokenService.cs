using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskManagement.API.Models;

namespace TaskManagement.API.Services
{
    public interface ITokenService
    {
        string GenerateToken(User user);
        ClaimsPrincipal? ValidateToken(string token);
    }

    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;
        private readonly string _jwtSecret;
        private readonly string _jwtIssuer;
        private readonly string _jwtAudience;
        private readonly int _jwtExpiryMinutes;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
            _jwtSecret = configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret not configured");
            _jwtIssuer = configuration["Jwt:Issuer"] ?? "TaskManagementAPI";
            _jwtAudience = configuration["Jwt:Audience"] ?? "TaskManagementApp";
            _jwtExpiryMinutes = int.Parse(configuration["Jwt:ExpiryMinutes"] ?? "480"); // 8 hours default
        }

        public string GenerateToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtSecret);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserNumber.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.GivenName, user.FirstName),
                new Claim(ClaimTypes.Surname, user.LastName),
                new Claim("FullName", user.FullName),
                new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "TeamMember")
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtExpiryMinutes),
                Issuer = _jwtIssuer,
                Audience = _jwtAudience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_jwtSecret);

                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _jwtIssuer,
                    ValidateAudience = true,
                    ValidAudience = _jwtAudience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
