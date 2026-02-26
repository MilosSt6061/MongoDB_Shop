namespace Library.Entities.Tools
{
    public class TokenData
    {
        public string Token { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
        public bool IsAuthenticated { get; set; }
        public string InvalidMessage { get; set; }
    }
}
