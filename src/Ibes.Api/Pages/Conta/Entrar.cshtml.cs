using System.ComponentModel.DataAnnotations;
using Ibes.Foundation.Identidade;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Ibes.Api.Pages.Conta;

[AllowAnonymous]
public sealed class EntrarModel(SignInManager<Usuario> signIn, UserManager<Usuario> users) : PageModel
{
    [BindProperty, Required, EmailAddress, StringLength(254)] public string Email { get; set; } = "";
    [BindProperty, Required, StringLength(128)] public string Senha { get; set; } = "";
    [BindProperty(SupportsGet = true)] public string? ReturnUrl { get; set; }
    public string? Erro { get; private set; }

    public async Task<IActionResult> OnPostAsync()
    {
        if (ModelState.IsValid)
        {
            var user = await users.FindByEmailAsync(Email);
            if (user is not null)
            {
                var result = await signIn.PasswordSignInAsync(user, Senha, false, lockoutOnFailure: true);
                if (result.Succeeded) return LocalRedirect(Url.IsLocalUrl(ReturnUrl) ? ReturnUrl! : "/");
            }
            else
            {
                // Comparable password hashing work also for unknown accounts.
                var dummy = new Usuario();
                _ = users.PasswordHasher.HashPassword(dummy, Senha);
            }
        }
        Erro = "Não foi possível entrar. Confira os dados ou tente novamente mais tarde.";
        return Page();
    }
}
