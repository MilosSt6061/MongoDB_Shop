using DnsClient;
using Library.Entities.DTO;
using Library.Entities.Tools;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Shop.Entities;
using WebShop.Configuration;

namespace Shop.Providers
{
    public class KorisnikProvider
    {
        private readonly IMongoCollection<Korisnik> _korisnici;

        public KorisnikProvider(IMongoClient client, IOptions<MongoDbSettings> settings)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _korisnici = database.GetCollection<Korisnik>(settings.Value.KorisnikCollectionName);
        }

        public async Task<Korisnik?> NadjiKorisnika(string username) =>
            await _korisnici.Find(c => c.Username == username).FirstOrDefaultAsync();

        public async Task<bool> DodajKorisnika(Korisnik k)
        {
            var postojeci = await NadjiKorisnika(k.Username);
            if (postojeci != null) 
            {
                return false;
            }

            var Password = BCrypt.Net.BCrypt.HashPassword(k.Lozinka, workFactor: 11);
            k.Id = null;
            k.Lozinka = Password;
            k.Uloga = "user";

            await _korisnici.InsertOneAsync(k);

            if (k.Id != null) 
                return true;

            return false;
        }
        public async Task<TokenData> ProveriKorisnika(LoginData login)
        {
            var postojeci = await NadjiKorisnika(login.Username);

            if (postojeci == null)
            {
                return new TokenData
                {
                    IsAuthenticated = false,
                    InvalidMessage = "Korisnicko ime nije pronadjeno"
                };
            }

            bool isValid = BCrypt.Net.BCrypt.Verify(login.Password, postojeci.Lozinka);

            if (!isValid)
            {
                return new TokenData
                {
                    IsAuthenticated = false,
                    InvalidMessage = "Lozinka se ne podudara"
                };
            }

            return new TokenData
            {
                IsAuthenticated = true,
                Username = login.Username,
                Role = postojeci.Uloga
            };
        }

        public async Task<KorisnikDTO> VratiPodatke(string username)
        {
            var postojeci = await NadjiKorisnika(username);
            if (postojeci == null) return new KorisnikDTO();
            return new KorisnikDTO
            {
                Username = username,
                Name = postojeci.Ime,
                Lastname = postojeci.Prezime,
                Email = postojeci.Email,
                Number = postojeci.Broj
            };
        }

        public async Task<bool> ObrisiKorisnika(string username)
        {
            var result = await _korisnici.DeleteOneAsync(p => p.Username == username);
            return result.DeletedCount > 0;
        }

        public async Task<List<KorisnikDTO>> VratiKorisnike()
        {
            var list = await _korisnici.Find(_ => true).ToListAsync();
            List<KorisnikDTO> korisnici = new List<KorisnikDTO>();

            foreach (var item in list)
            {
                korisnici.Add
                    (new KorisnikDTO
                    {
                        Username = item.Username,
                        Name = item.Ime, 
                        Lastname = item.Prezime, 
                        Email = item.Email,
                        Number = item.Broj
                    }
                    );
            }

            return korisnici;
        }

        public async Task<bool> IzmeniLozinku(string username, string oldpass, string newpass)
        {
            var postojeci = await NadjiKorisnika(username);

            if (postojeci == null)
            {
                return false;
            }

            bool isValid = BCrypt.Net.BCrypt.Verify(oldpass, postojeci.Lozinka);

            if (!isValid)
            {
                return false;
            }

            var Password = BCrypt.Net.BCrypt.HashPassword(newpass, workFactor: 11);
            postojeci.Lozinka = Password;

            var result = await _korisnici.ReplaceOneAsync(p => p.Username == username, postojeci);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> IzmeniKorisnika(KorisnikDTO data)
        {
            var postojeci = await NadjiKorisnika(data.Username);

            if (postojeci == null)
            {
                return false;
            }

            postojeci.Ime = data.Name;
            postojeci.Prezime = data.Lastname;
            postojeci.Email = data.Email;
            postojeci.Broj = data.Number;

            var result = await _korisnici.ReplaceOneAsync(p => p.Username == data.Username, postojeci);
            return result.ModifiedCount > 0;
        }
    }
}