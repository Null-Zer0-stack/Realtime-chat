using Microsoft.AspNetCore.SignalR;

namespace ReactChatWebApi.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(string userId, string userName, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", userId, userName, message, DateTime.Now.ToString("HH:mm"));
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
