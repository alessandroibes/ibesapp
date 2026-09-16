using System.Diagnostics;
using System.Security.Cryptography.X509Certificates;
using System.Threading.RateLimiting;
using Ibes.Api.Features;
using Ibes.Api.Features.Dominio;
using Microsoft.AspNetCore.Antiforgery;
using Ibes.Api.Infrastructure;
using Ibes.Foundation.Identidade;
using Ibes.Foundation.Organizacoes;
using Ibes.Foundation.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Validation.AspNetCore;
using OpenIddict.Abstractions;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole();
builder.Logging.AddFilter("Microsoft.AspNetCore", LogLevel.Warning);
builder.Logging.AddFilter("OpenIddict", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = c =>
    c.ProblemDetails.Extensions["traceId"] = Activity.Current?.TraceId.ToString() ?? c.HttpContext.TraceIdentifier);
builder.Services.AddExceptionHandler<SafeExceptionHandler>();
builder.Services.AddScoped<TenantContext>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<Relogio>();
builder.Services.AddDbContext<AppDbContext>(o =>
{
    o.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException("Configure ConnectionStrings__Postgres."));
    o.UseOpenIddict();
});
builder.Services.AddIdentity<Usuario, IdentityRole<Guid>>(o =>
{
    o.Password.RequiredLength = 12;
    o.User.RequireUniqueEmail = true;
    o.Lockout.MaxFailedAccessAttempts = 5;
    o.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
}).AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders();
builder.Services.Configure<SecurityStampValidatorOptions>(o => o.ValidationInterval = TimeSpan.Zero);
builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.Name = "__Host-ibes.sessao";
    o.Cookie.HttpOnly = true;
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    o.Cookie.SameSite = SameSiteMode.Lax;
    o.LoginPath = "/conta/entrar";
    o.ExpireTimeSpan = TimeSpan.FromMinutes(30);
    o.SlidingExpiration = true;
    o.Events.OnRedirectToLogin = c =>
    {
        if (c.Request.Path.StartsWithSegments("/api") || c.Request.Path.StartsWithSegments("/bff"))
            c.Response.StatusCode = 401;
        else c.Response.Redirect(c.RedirectUri);
        return Task.CompletedTask;
    };
    o.Events.OnRedirectToAccessDenied = c => { c.Response.StatusCode = 403; return Task.CompletedTask; };
});
builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = "CookieOuBearer";
    o.DefaultChallengeScheme = "CookieOuBearer";
}).AddPolicyScheme("CookieOuBearer", null, o => o.ForwardDefaultSelector = c =>
    c.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
        ? OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme : IdentityConstants.ApplicationScheme);
builder.Services.AddAuthorization(o =>
{
    o.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
    foreach (var permission in Permissoes.Todas)
        o.AddPolicy(permission, p => p.RequireAuthenticatedUser().RequireAssertion(c =>
            c.Resource is HttpContext http && http.Items["permissoes"] is string[] permissions && permissions.Contains(permission)));
});
builder.Services.AddAntiforgery(o =>
{
    o.HeaderName = "X-CSRF-TOKEN";
    o.Cookie.Name = "__Host-ibes.csrf";
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    o.Cookie.SameSite = SameSiteMode.Strict;
});
builder.Services.AddRazorPages();
var protection = builder.Services.AddDataProtection().SetApplicationName("ibes");
if (builder.Configuration["DataProtection:Certificate"] is { Length: > 0 } protectionCertificate)
    protection.ProtectKeysWithCertificate(X509CertificateLoader.LoadPkcs12FromFile(
        protectionCertificate, builder.Configuration["DataProtection:CertificatePassword"]));
builder.Services.AddOpenApi("v1", options => options.AddOperationTransformer((operation, context, ct) =>
{
    if (context.Description.RelativePath?.StartsWith("api/v1/", StringComparison.Ordinal) == true)
    {
        operation.Parameters ??= [];
        if (!operation.Parameters.Any(p => p.Name == "X-Igreja-Id"))
            operation.Parameters.Add(new Microsoft.OpenApi.OpenApiParameter
            {
                Name = "X-Igreja-Id",
                In = Microsoft.OpenApi.ParameterLocation.Header,
                Required = true,
                Description = "Igreja selecionada. Exige vínculo e permissão da conta autenticada.",
                Schema = new Microsoft.OpenApi.OpenApiSchema { Type = Microsoft.OpenApi.JsonSchemaType.String, Format = "uuid" }
            });
    }
    return Task.CompletedTask;
}));
builder.Services.AddHealthChecks().AddCheck<PostgresHealthCheck>("postgres", tags: ["ready"]);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("autenticacao", c => RateLimitPartition.GetFixedWindowLimiter(
        c.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});
builder.Services.AddOpenIddict()
    .AddCore(o => o.UseEntityFrameworkCore().UseDbContext<AppDbContext>())
    .AddServer(o =>
    {
        o.SetIssuer(new Uri(builder.Configuration["Auth:Issuer"] ?? "https://localhost:7443/"));
        o.SetAuthorizationEndpointUris("/connect/authorize").SetTokenEndpointUris("/connect/token");
        o.AllowAuthorizationCodeFlow().RequireProofKeyForCodeExchange();
        o.SetAccessTokenLifetime(TimeSpan.FromMinutes(10));
        o.RegisterScopes("fundacao");
        if (builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing"))
            o.AddEphemeralEncryptionKey().AddEphemeralSigningKey();
        else
        {
            o.AddSigningCertificate(X509CertificateLoader.LoadPkcs12FromFile(
                builder.Configuration["Auth:SigningCertificate"]!, builder.Configuration["Auth:CertificatePassword"]));
            o.AddEncryptionCertificate(X509CertificateLoader.LoadPkcs12FromFile(
                builder.Configuration["Auth:EncryptionCertificate"]!, builder.Configuration["Auth:CertificatePassword"]));
        }
        o.UseAspNetCore().EnableAuthorizationEndpointPassthrough().EnableTokenEndpointPassthrough();
    })
    .AddValidation(o => { o.UseLocalServer(); o.UseAspNetCore(); o.AddAudiences("ibes-api"); });
var telemetry = builder.Services.AddOpenTelemetry().ConfigureResource(r => r.AddService("ibes-api"))
    .WithMetrics(m => m.AddAspNetCoreInstrumentation().AddMeter("Microsoft.AspNetCore.Hosting"))
    .WithTracing(t => t.AddAspNetCoreInstrumentation(o => o.Filter = c =>
        !c.Request.Path.StartsWithSegments("/connect") && !c.Request.Path.StartsWithSegments("/conta")));
if (!string.IsNullOrWhiteSpace(builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"]))
    telemetry.WithMetrics(m => m.AddOtlpExporter()).WithTracing(t => t.AddOtlpExporter());

var app = builder.Build();
if (args.Contains("--migrate", StringComparer.Ordinal))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    await Bootstrap.RegistrarClienteAsync(scope.ServiceProvider, app.Configuration);
    if (app.Environment.IsDevelopment()) await Bootstrap.SeedDevelopmentAsync(scope.ServiceProvider, app.Configuration);
    return;
}
app.UseExceptionHandler();
app.UseStatusCodePages();
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseHttpsRedirection();
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
    context.Response.Headers["X-Trace-Id"] = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;
    if (context.Request.Path.StartsWithSegments("/api") || context.Request.Path.StartsWithSegments("/bff") || context.Request.Path.StartsWithSegments("/conta"))
        context.Response.Headers.CacheControl = "no-store";
    await next();
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseRateLimiter();
app.UseAuthentication();
app.Use(async (context, next) =>
{
    if (context.User.Identity?.IsAuthenticated == true && context.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        var users = context.RequestServices.GetRequiredService<UserManager<Usuario>>();
        var user = await users.FindByIdAsync(context.User.GetClaim("sub") ?? "");
        if (user is null || await users.IsLockedOutAsync(user) || user.SecurityStamp != context.User.GetClaim("security_stamp") || !context.User.HasScope("fundacao"))
        {
            await Results.Problem(statusCode: 401, title: "Sessão inválida ou expirada.").ExecuteAsync(context); return;
        }
    }
    await next(context);
});
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/v1") && !HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method)
        && !context.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        try { await context.RequestServices.GetRequiredService<IAntiforgery>().ValidateRequestAsync(context); }
        catch (AntiforgeryValidationException) { await Results.Problem(statusCode: 400, title: "Requisição inválida. Atualize a página e tente novamente.").ExecuteAsync(context); return; }
    }
    await next(context);
});
app.UseAntiforgery();
app.MapRazorPages().RequireRateLimiting("autenticacao");
app.MapIdentidade();
app.MapFundacao();
app.MapPessoas();
app.MapEmbaixada();
app.MapProgressao();
app.MapAgenda();
app.MapFrequencia();
app.MapOrganizacao();
app.MapCompeticoes();
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") }).AllowAnonymous();
app.MapOpenApi().AllowAnonymous();
app.Run();

public partial class Program;
