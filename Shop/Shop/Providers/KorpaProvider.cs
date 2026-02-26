using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Shop.Entities;
using WebShop.Configuration;

namespace Shop.Providers
{
    public class KorpaProvider
    {

        private readonly IMongoCollection<Korisnik> _korisnici;
        private readonly IMongoCollection<Korpa> _korpe;

        public KorpaProvider(IMongoClient client, IOptions<MongoDbSettings> settings)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _korisnici = database.GetCollection<Korisnik>(settings.Value.KorisnikCollectionName);
            _korpe = database.GetCollection<Korpa>(settings.Value.KorpaCollectionName);
        }

        public async Task<Korpa> NadjiKorpu(string username)
        {
            var k = await _korisnici.Find(c => c.Username == username).FirstOrDefaultAsync();
            if (k == null) throw new Exception("Ne postojeci username");

            var korpa = await _korpe.Find(c => c.Username == username).FirstOrDefaultAsync();
            if (korpa == null)
            {
                korpa = new Korpa
                {
                    Username = username,
                    Stavke = new List<Stavka>(),
                    UkupnaCena = 0
                };
                _korpe.InsertOne(korpa);
            }
            return korpa;
        }

        public async Task<bool> DodajUKorpu(string username, Stavka stavka)
        {
            var korpa = await NadjiKorpu(username);

            var postojeci = korpa.Stavke.FirstOrDefault(i => i.ProizvodID == stavka.ProizvodID);
            stavka.Id = null;

            if (postojeci != null)
            {
                postojeci.Kolicina += stavka.Kolicina;
                postojeci.Cena += stavka.Cena;
            }
            else
            {
                korpa.Stavke.Add(stavka);
            }

            korpa.UkupnaCena = korpa.UkupnaCena + stavka.Cena;

            var result = await _korpe.ReplaceOneAsync(c => c.Id == korpa.Id, korpa);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UkloniIzKorpe(string username, string proizvodID, int num)
        {
            var korpa = await NadjiKorpu(username);

            if (num == 0) 
            {
                korpa.Stavke.RemoveAll(i => i.ProizvodID == proizvodID);
                korpa.UkupnaCena = korpa.Stavke.Sum(i => i.Cena);
            }
            else
            {
                var postojeci = korpa.Stavke.FirstOrDefault(i => i.ProizvodID == proizvodID);
                if (postojeci == null) { return false; }
                int c = postojeci.Cena / postojeci.Kolicina;
                postojeci.Kolicina = num;
                postojeci.Cena = num * c;
            }

            var result = await _korpe.ReplaceOneAsync(c => c.Id == korpa.Id, korpa);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> OcistKorpu(string username)
        {
            var result = await _korpe.DeleteOneAsync(c => c.Username == username);
            return result.DeletedCount > 0;
        }
    }
}
