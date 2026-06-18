using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactChatModels;
using ReactChatWebApi.Data;
using Microsoft.AspNetCore.SignalR;
using ReactChatWebApi.Hubs;
using System.Security.Claims;

namespace ReactChatWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDb _db;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(AppDb db, IHubContext<ChatHub> hubContext)
        {
            _db = db;
            _hubContext = hubContext;
        }

        // Get current user info from JWT token
        private string GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
        }

        private string GetCurrentUserName()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "User";
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var currentUserId = GetCurrentUserId();
            var users = await _db.Users
                .Where(u => u.Id.ToString() != currentUserId)
                .Select(u => new {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.IsOnline,
                    u.UserIdVisible
                })
                .ToListAsync();

            return Ok(users);
        }

        
        [HttpGet("user/{visibleId}")]
        public async Task<IActionResult> GetUserByVisibleId(string visibleId)
        {
            var user = await _db.Users
                .Where(u => u.UserIdVisible == visibleId.ToUpper())
                .Select(u => new { u.Id, u.Name, u.Email, u.UserIdVisible, u.IsOnline })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }

        [HttpGet("messages/{friendId}")]
        public async Task<IActionResult> GetMessages(string friendId)
        {
            var currentUserId = GetCurrentUserId();

            var messages = await _db.Messages
                .Where(m =>
                    (m.SenderId == currentUserId && m.ReceiverId == friendId) ||
                    (m.SenderId == friendId && m.ReceiverId == currentUserId))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SaveMessage([FromBody] Message message)
        {
            var currentUserId = GetCurrentUserId();
            var currentUserName = GetCurrentUserName();

            message.SenderId = currentUserId;
            message.SenderName = currentUserName;
            message.Timestamp = DateTime.UtcNow;

            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync(
                "ReceiveMessage",
                message.SenderId,
                message.SenderName,
                message.ReceiverId,
                message.Content,
                message.Timestamp.ToString("HH:mm")
            );

            return Ok(message);
        }
    }
}