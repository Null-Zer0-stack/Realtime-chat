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
    public class LoginController : Controller
    {
        private readonly AppDb _db;
        private readonly Jwt _jwt;

        public LoginController(AppDb db, Jwt jwt)
        {
            this._db = db;
            this._jwt = jwt;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            user.IsOnline = true;
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

