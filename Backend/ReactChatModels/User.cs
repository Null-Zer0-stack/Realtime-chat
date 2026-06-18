using System.ComponentModel.DataAnnotations;

namespace ReactChatModels
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [Required]
        public string UserIdVisible { get; set; } = string.Empty;

        public bool IsOnline { get; set; } = false;
    }
}
