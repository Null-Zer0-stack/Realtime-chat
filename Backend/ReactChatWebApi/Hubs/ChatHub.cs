using Microsoft.AspNetCore.SignalR;

namespace ReactChatWebApi.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string senderId, string senderName, string receiverId, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", senderId, senderName, receiverId, message, DateTime.Now.ToString("HH:mm"));
        }

        public async Task UserConnected(string userId, string userName)
        {
            await Clients.All.SendAsync("UserConnected", userId, userName);
        }

        public async Task UserDisconnected(string userId, string userName)
        {
            await Clients.All.SendAsync("UserDisconnected", userId, userName);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
        }
    }
}
