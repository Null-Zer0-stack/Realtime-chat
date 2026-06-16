using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReactChatModels;
using ReactChatWebApi.Data;
using ReactChatWebApi.Utilities;
using Microsoft.AspNetCore.SignalR; 
using ReactChatWebApi.Hubs;

namespace ReactChatWebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : Controller
    {
        private readonly AppDb _db;
        private readonly IHubContext<ChatHub> _hubContext;


        public ChatController(AppDb db , IHubContext<ChatHub> hubContext)
        {
            this._db = db;
            this._hubContext = hubContext;
        }


        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages()
        {
            var messages = await _db.Messages
                .OrderByDescending(m => m.Timestamp)
                .Take(50)
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("messages")]
        public async Task<IActionResult> SaveMessage([FromBody] Message message)
        {
            message.Timestamp = DateTime.UtcNow;
            _db.Messages.Add(message);
            await _db.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync(
                "ReceiveMessage",
                message.SenderId,
                message.SenderName ?? "User",
                message.Content,
                message.Timestamp.ToString("HH:mm")
            );

            return Ok(message);
        }
    }
}
