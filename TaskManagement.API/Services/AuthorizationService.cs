using System.Security.Claims;

namespace TaskManagement.API.Services
{
    public interface IAuthorizationService
    {
        int? GetUserId(ClaimsPrincipal user);
        bool IsAdmin(ClaimsPrincipal user);
        bool IsOwnerOrAdmin(int userId, int ownerUserId, ClaimsPrincipal user);
    }

    public class AuthorizationService : IAuthorizationService
    {
        public int? GetUserId(ClaimsPrincipal user)
        {
            var claim = user?.FindFirst(ClaimTypes.NameIdentifier);
            if (int.TryParse(claim?.Value, out int userId))
                return userId;
            return null;
        }

        public bool IsAdmin(ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Role)?.Value == "Admin";
        }

        public bool IsOwnerOrAdmin(int userId, int ownerUserId, ClaimsPrincipal user)
        {
            return IsAdmin(user) || userId == ownerUserId;
        }
    }
}
