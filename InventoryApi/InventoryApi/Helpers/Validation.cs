using System.Text.RegularExpressions;

namespace InventoryApi.Helpers
{
    public static class Validation
    {
        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$");
        }

        public static bool IsValidPhone(string phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            return Regex.IsMatch(phone, @"^\d{10}$");
        }

        public static string? PasswordError(string password)
        {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                return "Password must be at least 8 characters.";
            if (!Regex.IsMatch(password, @"[A-Za-z]"))
                return "Password must include at least one letter.";
            if (!Regex.IsMatch(password, @"\d"))
                return "Password must include at least one number.";
            if (!Regex.IsMatch(password, @"[!@#$%^&*(),.?"":{}|<>_\-+=~`\[\]\\/;']"))
                return "Password must include at least one special character.";
            return null;
        }
    }
}