using Microsoft.AspNetCore.Mvc;
using Shop.Entities;
using Shop.Providers;

namespace Shop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProizvodController : ControllerBase
    {
        private readonly ProizvodProvider _service;

        public ProizvodController(ProizvodProvider service)
        {
            _service = service;
        }

        [HttpGet("VratiSveProizvode")]
        public async Task<IActionResult> VratiSveProizvode()
        {
            try
            {
                var result = await _service.VratiSveProizvode();
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("VratiSveProizvodePoKategoriji/{kategorijaID}")]
        public async Task<IActionResult> VratiSveProizvodePoKategoriji(string kategorijaID)
        {
            try
            {
                var result = await _service.VratiSveProizvodePoKategoriji(kategorijaID);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("VratiSveProizvodePoCeni/{cena}")]
        public async Task<IActionResult> VratiSveProizvodePoCeni(int cena)
        {
            try
            {
                var result = await _service.VratiSveProizvodePoCeni(cena);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("VratiSveProizvodePoNazivu/{naziv}")]
        public async Task<IActionResult> VratiSveProizvodePoNazivu(string naziv)
        {
            try
            {
                var result = await _service.VratiSveProizvodePoNazivu(naziv);
                return Ok(result);
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("KreirajProizvodInvetar/{kolicina}")]
        public async Task<IActionResult> KreirajProizvodInvetar([FromBody] Proizvod proizvod, int kolicina)
        {
            try
            {
                var result = await _service.KreirajProizvodInvetar(proizvod, kolicina);
                if(result) return Ok("Uspesno kreirani proizvod i inventar");
                else return BadRequest("Doslo je do greske pri kreiranju proizvoda i inventara");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("IzmeniProizvod")]
        public async Task<IActionResult> IzmeniProizvod([FromBody] Proizvod proizvod)
        {
            try
            {
                var result = await _service.IzmeniProizvod(proizvod);
                if(result) return Ok("Uspesno izmenjen proizvod");
                else return BadRequest("Doslo je do greske pri azuriranju proizvoda");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("ObrisiProizvodInventar/{proizvodID}")]
        public async Task<IActionResult> ObrisiProizvodInventar(string proizvodID)
        {
            try
            {
                var result = await _service.ObrisiProizvodInventar(proizvodID);
                if(result) return Ok("Uspesno obrisan proizvod i inventar");
                else return BadRequest("Doslo je do greske pri brisanju proizvoda i inventara");
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}