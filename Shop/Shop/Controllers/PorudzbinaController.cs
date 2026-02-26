using Library.Entities.DTO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Shop.DTO;
using Shop.Providers;

namespace Shop.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PorudzbinaController : ControllerBase
    {
        PorudzbinaProvider porudzbinaProvider { get; set; }

        public PorudzbinaController(PorudzbinaProvider p)
        {
            porudzbinaProvider = p;
        }

        [HttpGet("Porudzbine/{username}")]
        public async Task<IActionResult> VratiPorudzbine(string username)
        {
            try
            {
                return Ok(await porudzbinaProvider.VratiPorudzbine(username));
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("Poruci/{username}")]
        public async Task<IActionResult> DodajPorudzbinu(string username)
        {
            try
            {
                var response = await porudzbinaProvider.Naruci(username);
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

        [HttpDelete("ObrisiPorudzbinu/{id}")]
        public async Task<IActionResult> ObrisiPorudzbinu(string id)
        {
            try
            {
                var response = await porudzbinaProvider.ObrisiPorudzbinu(id);
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

        [HttpPut("IzmeniStatus/{id}/{status}")]
        public async Task<IActionResult> IzmeniStatus(string id, Status status)
        {
            try
            {
                var response = await porudzbinaProvider.PromeniStatus(id,status);
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
