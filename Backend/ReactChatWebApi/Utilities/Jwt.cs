using Microsoft.IdentityModel.Tokens;
using ReactChatModels;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ReactChatWebApi.Utilities
{
    public class Jwt
    {
        private readonly string _secretKey;
        private readonly string _issuer;
        private readonly string _audience;

        public Jwt(IConfiguration config)
        {
            _secretKey = config["Jwt:SecretKey"] ?? throw new Exception("JWT SecretKey not configured");
            _issuer = config["Jwt:Issuer"] ?? "ChatAPI";
            _audience = config["Jwt:Audience"] ?? "ChatAPIUsers";
        }

        public string GenerateToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}
