using Microsoft.AspNetCore.Mvc;
using Shop.Entities;
using Shop.Providers;

namespace Shop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KategorijaController : ControllerBase
    {
        private readonly KategorijaProvider _service;

        public KategorijaController(KategorijaProvider service)
        {
            _service = service;
        }

        [HttpGet("VratiSveKategorije")]
        public async Task<IActionResult> VratiSveKategorije()
        {
            try
            {
                var result = await _service.VratiSveKategorije();
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("KreirajKategoriju")]
        public async Task<IActionResult> KreirajKategoriju([FromBody] Kategorija kategorija)
        {
            try
            {
                var result = await _service.KreirajKategoriju(kategorija);
                if(result) return Ok("Uspesno kreirana kategorija");
                else return BadRequest("Doslo je do greske pri kreiranju kategorije");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("IzmeniKategoriju")]
        public async Task<IActionResult> IzmeniKategoriju([FromBody] Kategorija kategorija)
        {
            try
            {
                var result = await _service.IzmeniKategoriju(kategorija);
                if(result) return Ok("Uspesno izmenjena kategorija");
                else return BadRequest("Doslo je do greske pri azuriranju kategorije");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("ObrisiKategoriju/{kategorijaID}")]
        public async Task<IActionResult> ObrisiKategoriju(string kategorijaID)
        {
            try
            {
                var result = await _service.ObrisiKategoriju(kategorijaID);
                if(result) return Ok("Uspesno obrisana kategorija");
                else return BadRequest("Doslo je do greske pri brisanju kategorije");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}