using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shop.Entities;
using Shop.Providers;

namespace Shop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KorpaController : ControllerBase
    {
        KorpaProvider korpaProvider { get; set; }

        public KorpaController(KorpaProvider p)
        {
            korpaProvider = p;
        }

        [HttpGet("Korpa/{username}")]
        public async Task<IActionResult> VratiKorpu(string username)
        {
            try
            {
                return Ok(await korpaProvider.NadjiKorpu(username));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("DodajUKorpu/{username}")]
        public async Task<IActionResult> DodajUKorpu(string username, [FromBody] Stavka stavka)
        {
            try
            {
                var response = await korpaProvider.DodajUKorpu(username,stavka);
                if (response == false)
                {
                    return BadRequest("Porudzbina nije uspela");
                }
                return Ok("Uspesno ste kreirali porudzbinu");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("UkloniIzKorpu")]
        public async Task<IActionResult> UkloniIzKorpu([FromBody] string username, string proizvodid, int num)
        {
            try
            {
                var response = await korpaProvider.UkloniIzKorpe(username, proizvodid, num);
                if (response == false)
                {
                    return BadRequest("Porudzbina nije uspela");
                }
                return Ok("Uspesno ste kreirali porudzbinu");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("OcistiKorpu/{username}")]
        public async Task<IActionResult> OcistiKorpu(string username)
        {
            try
            {
                var response = await korpaProvider.OcistKorpu(username);
                if (response == false)
                {
                    return BadRequest("Brisanje nije uspelo");
                }
                return Ok("Uspesno ste obrisali porudzbinu");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


    }
}
