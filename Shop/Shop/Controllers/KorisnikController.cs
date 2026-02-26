using Shop.Providers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.FileProviders;
using Shop.Entities;
using Library.Entities.DTO;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using BCrypt.Net;
using Library.Entities.Tools;

namespace Cinema.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KorisnikController : ControllerBase
    {
        KorisnikProvider korisnikProvider { get; set; }
        private readonly IConfiguration _config; 

        public KorisnikController(IConfiguration config, KorisnikProvider k)
        {
            _config = config;
            korisnikProvider = k;
        }

        //[Authorize]
        [HttpGet("Podaci/{username}")]
        public async Task<IActionResult> VratiPodatke(string username)
        {
            try
            {
                return Ok(await korisnikProvider.VratiPodatke(username));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [AllowAnonymous]
        [HttpPost("Registracija")]
        public async Task<IActionResult> SignUp([FromBody]Korisnik user)
        {
            try
            {
                var response = await korisnikProvider.DodajKorisnika(user);
                if (response == false)
                {
                    return BadRequest("Neuspesna registracija");
                }
                return Ok("Uspesna registracija");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        //[Authorize(Roles = "admin")]
        [HttpGet("SviKorisnici")]
        public async Task<IActionResult> SviKorisnici()
        {
            try
            {
                return Ok(await korisnikProvider.VratiKorisnike());
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [AllowAnonymous]
        [HttpPost("Prijava")]
        public async Task<IActionResult> LogIn([FromBody] LoginData user)
        {
            try
            {
                var tokenData = await  korisnikProvider.ProveriKorisnika(new LoginData
                {
                    Username = user.Username,
                    Password = user.Password
                });

                if (tokenData == null || !tokenData.IsAuthenticated)
                {
                    return Unauthorized(new TokenData
                    {
                        IsAuthenticated = false,
                        InvalidMessage = tokenData?.InvalidMessage ?? "Greška prilikom autentikacije"
                    });
                }

                
                var jwtSettings = _config.GetSection("Jwt");
                var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]);

                var claims = new[]
                {
                new Claim(ClaimTypes.Name, tokenData.Username),
                new Claim(ClaimTypes.Role, tokenData.Role)
                };

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpireMinutes"])),
                    Issuer = jwtSettings["Issuer"],
                    Audience = jwtSettings["Audience"],
                    SigningCredentials = new SigningCredentials(
                        new SymmetricSecurityKey(key),
                        SecurityAlgorithms.HmacSha256
                    )
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var jwt = tokenHandler.WriteToken(token);

                return Ok(new TokenData
                {
                    Token = jwt,
                    IsAuthenticated = true,
                    Username = tokenData.Username,
                    Role = tokenData.Role
                });

            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        //[Authorize]
        [HttpPut("EditAccount")]
        public async Task<IActionResult> EditAccount([FromBody] KorisnikDTO user)
        {
            try
            {
                var response = await korisnikProvider.IzmeniKorisnika(user);
                if (response == false)
                {
                    return BadRequest("Izmena nije uspela");
                }
                return Ok("Uspesno ste izmenili nalog");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        //[Authorize]
        [HttpPut("EditPassword")]
        public async Task<IActionResult> EditPassword([FromBody] string username, string oldPassword, string newPassword)
        {
            try
            {
                var response = await korisnikProvider.IzmeniLozinku(username, oldPassword, newPassword);
                if (response == false)
                {
                    return BadRequest("Izmena nije uspesna");
                }
                return Ok("Uspesno ste izmenili nalog");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        //[Authorize(Roles = "admin")]
        [HttpDelete("DeleteAccount")]
        public async Task<IActionResult> DeleteAccount([FromBody] string username)
        {
            try
            {
                var response = await korisnikProvider.ObrisiKorisnika(username);
                if (response == false)
                {
                    return BadRequest("Neuspesno brisanje");
                }
                return Ok("Uspesno ste obrisali nalog");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
