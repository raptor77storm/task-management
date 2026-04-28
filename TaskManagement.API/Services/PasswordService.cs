using System.Security.Cryptography;
using System.Text;

namespace TaskManagement.API.Services
{
    public interface IPasswordService
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hash);
    }

    public class PasswordService : IPasswordService
    {
        private const int SaltSize = 16; // 128 bits
        private const int HashSize = 20; // 160 bits
        private const int Iterations = 10000; // PBKDF2 iterations

        /// <summary>
        /// Hash a password using PBKDF2
        /// </summary>
        public string HashPassword(string password)
        {
            using (var rng = new RNGCryptoServiceProvider())
            {
                byte[] salt = new byte[SaltSize];
                rng.GetBytes(salt);

                using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256))
                {
                    byte[] hash = pbkdf2.GetBytes(HashSize);

                    // Combine salt + hash for storage
                    byte[] hashWithSalt = new byte[SaltSize + HashSize];
                    Array.Copy(salt, 0, hashWithSalt, 0, SaltSize);
                    Array.Copy(hash, 0, hashWithSalt, SaltSize, HashSize);

                    // Return as base64 string
                    return Convert.ToBase64String(hashWithSalt);
                }
            }
        }

        /// <summary>
        /// Verify a password against its hash
        /// </summary>
        public bool VerifyPassword(string password, string hash)
        {
            try
            {
                byte[] hashWithSalt = Convert.FromBase64String(hash);

                // Extract salt
                byte[] salt = new byte[SaltSize];
                Array.Copy(hashWithSalt, 0, salt, 0, SaltSize);

                // Compute hash for provided password
                using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, Iterations, HashAlgorithmName.SHA256))
                {
                    byte[] computedHash = pbkdf2.GetBytes(HashSize);

                    // Compare computed hash with stored hash
                    for (int i = 0; i < HashSize; i++)
                    {
                        if (hashWithSalt[SaltSize + i] != computedHash[i])
                            return false;
                    }
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
