using Microsoft.AspNetCore.Mvc;
using Shop.Entities;
using Shop.Providers;

namespace Shop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarController : ControllerBase
    {
        private readonly InventarProvider _service;

        public InventarController(InventarProvider service)
        {
            _service = service;
        }

        [HttpGet("VratiKolicinuZaProizvod/{proizvodID}")]
        public async Task<IActionResult> VratiKolicinuZaProizvod(string proizvodID)
        {
            try
            {
                var result = await _service.VratiKolicinuZaProizvod(proizvodID);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("VratiUkupnuKolicinuZaProizvod/{proizvodID}")]
        public async Task<IActionResult> VratiUkupnuKolicinuZaProizvod(string proizvodID)
        {
            try
            {
                var result = await _service.VratiUkupnuKolicinuZaProizvod(proizvodID);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("IzmeniKolicinuProizvoda/{proizvodID}/{kolicina}")]
        public async Task<IActionResult> IzmeniKolicinuProizvoda(string proizvodID, int kolicina)
        {
            try
            {
                var result = await _service.IzmeniKolicinuProizvoda(proizvodID, kolicina);
                if(result) return Ok("Uspesno izmenjena kolicina za proizvod");
                else return BadRequest("Doslo je do greske pri azuriranju kolicine proizvoda");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}