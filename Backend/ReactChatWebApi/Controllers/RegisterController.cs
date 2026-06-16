using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactChatModels;
using ReactChatWebApi.Data;
using ReactChatWebApi.Utilities;


namespace ReactChatWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisterController : Controller
    {
        private readonly AppDb _db;
        private readonly Jwt _jwt;

        public RegisterController(AppDb db , Jwt jwt)
        {
                this._db = db;
                this._jwt = jwt;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            // Check if user already exists
            if (await _db.Users.AnyAsync(u => u.Email == model.Email))
            {
                return BadRequest(new { message = "User with this email already exists" });
            }

            var user = new User
            {
                Name = model.Name,
                Email = model.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password),
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var token = _jwt.GenerateToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email,
                Name = user.Name
            });
        }
    }
}
