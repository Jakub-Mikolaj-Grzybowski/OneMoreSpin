namespace OneMoreSpin.Web.Configuration;

public sealed record JwtSettings(string Key, string Issuer, string Audience)
{
    public static JwtSettings Load(IConfiguration configuration)
    {
        var key = ReadValue(configuration, "Jwt:Key", "JWT_KEY");
        var issuer = ReadValue(configuration, "Jwt:Issuer", "JWT_ISSUER")
            ?? "onemorespin.jakubg.org";
        var audience = ReadValue(configuration, "Jwt:Audience", "JWT_AUDIENCE")
            ?? "onemorespin.jakubg.org";

        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("JWT_KEY is not configured.");

        if (System.Text.Encoding.UTF8.GetByteCount(key) < 32)
            throw new InvalidOperationException("JWT_KEY must contain at least 32 bytes.");

        return new JwtSettings(key, issuer, audience);
    }

    private static string? ReadValue(
        IConfiguration configuration,
        string configurationKey,
        string environmentKey
    )
    {
        var value = configuration[configurationKey];
        if (string.IsNullOrWhiteSpace(value))
            value = Environment.GetEnvironmentVariable(environmentKey);

        if (string.IsNullOrWhiteSpace(value))
            return null;

        value = value.Trim();
        if (
            value.Length >= 2
            && ((value[0] == '"' && value[^1] == '"')
                || (value[0] == '\'' && value[^1] == '\''))
        )
        {
            value = value[1..^1].Trim();
        }

        return value;
    }
}
