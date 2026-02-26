using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Shop.DTO;
using Shop.Entities;
using WebShop.Configuration;

namespace Shop.Providers
{
    public class PorudzbinaProvider
    {
        private readonly IMongoCollection<Korisnik> _korisnici;
        private readonly IMongoCollection<Korpa> _korpe;
        private readonly IMongoCollection<Porudzbina> _porudzbine;
        private readonly IMongoCollection<Inventar> _inventar;

        public PorudzbinaProvider(IMongoClient client, IOptions<MongoDbSettings> settings)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _korisnici = database.GetCollection<Korisnik>(settings.Value.KorisnikCollectionName);
            _korpe = database.GetCollection<Korpa>(settings.Value.KorpaCollectionName);
            _porudzbine = database.GetCollection<Porudzbina>(settings.Value.PorudzbinaCollectionName);
            _inventar = database.GetCollection<Inventar>(settings.Value.InventarCollectionName);
        }

        public async Task<bool> Naruci(string username)
        {
            var k = await _korisnici.Find(c => c.Username == username).FirstOrDefaultAsync();
            if (k == null) throw new Exception("Ne postojeci username");

            var korpa = await _korpe.Find(c => c.Username == username).FirstOrDefaultAsync();
            if (korpa == null) throw new Exception("Korpa je prazna");

            Porudzbina porudzbina = new Porudzbina
            {
                Username = username,
                Stavke = korpa.Stavke,
                UkupnaCena = korpa.UkupnaCena,
                VremeKreiranja = DateTime.Now,
                Status = Status.NA_CEKANJU
            };

            _porudzbine.InsertOne(porudzbina);
            if (porudzbina.Id != null) await _korpe.DeleteOneAsync(c => c.Username == username);

            return porudzbina.Id != null;
        }

        public async Task<List<Porudzbina>> VratiPorudzbine(string username)
        {
            return await _porudzbine.Find(c => c.Username == username).ToListAsync<Porudzbina>();
        }

        public async Task<bool> ObrisiPorudzbinu(string id)
        {
            var result = await _porudzbine.DeleteOneAsync(c => c.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<bool> PromeniStatus(string id, Status status)
        {
            var p = await _porudzbine.Find(c => c.Id == id).FirstOrDefaultAsync();
            if (p == null) throw new Exception("Nepostojeca porudzbina");

            if (p.Status == Status.ODBIJENA) throw new Exception("Porudzbina je vec odbijena");
            if (p.Status == Status.OTKAZANA) throw new Exception("Porudzbina je vec otkazana");
            if (p.Status == Status.VRACENA) throw new Exception("Porudzbina je vec vracena");

            bool inv_changed = false;

            if (status == Status.POSLATA && p.Status == Status.PRIHVACENA)
            {
                p.Status = status;
                var result = await _porudzbine.ReplaceOneAsync(p => p.Id == id, p);
                return result.ModifiedCount > 0;
            }
            if (status == Status.PRIHVACENA && p.Status == Status.NA_CEKANJU)
            {
                List<Inventar> inv = new List<Inventar>();
                foreach (var item in p.Stavke) 
                {
                    var i = await _inventar.Find(c => c.ProizvodID == item.ProizvodID).FirstOrDefaultAsync();
                    if (i == null) throw new Exception($"Nepostojeci proizvod {item.ProizvodINaziv}");
                    if ((i.Kolicina - i.RezervisanaKolicina) < item.Kolicina) throw new Exception($"Nedovoljno na stanju {item.ProizvodINaziv}");
                    i.RezervisanaKolicina += item.Kolicina;
                    inv.Add(i);
                }

                var updates = new List<WriteModel<Inventar>>();

                foreach (var i in inv)
                {
                    var filter = Builders<Inventar>.Filter.Eq(x => x.Id, i.Id);
                    var update = Builders<Inventar>.Update.Set(x => x.RezervisanaKolicina, i.RezervisanaKolicina);
                    updates.Add(new UpdateOneModel<Inventar>(filter, update));
                }

                if (updates.Count > 0)
                {
                    var result = await _inventar.BulkWriteAsync(updates);
                    inv_changed = result.ModifiedCount > 0;
                }
            }

            if (status == Status.OTKAZANA && (p.Status == Status.PRIHVACENA || p.Status == Status.POSLATA))
            {
                List<Inventar> inv = new List<Inventar>();
                foreach (var item in p.Stavke)
                {
                    var i = await _inventar.Find(c => c.ProizvodID == item.ProizvodID).FirstOrDefaultAsync();
                    if (i == null) throw new Exception($"Nepostojeci proizvod {item.ProizvodINaziv}");
                    if ((i.Kolicina - i.RezervisanaKolicina) < item.Kolicina) throw new Exception($"Nedovoljno na stanju {item.ProizvodINaziv}");
                    i.RezervisanaKolicina -= item.Kolicina;
                    inv.Add(i);
                }

                var updates = new List<WriteModel<Inventar>>();

                foreach (var i in inv)
                {
                    var filter = Builders<Inventar>.Filter.Eq(x => x.Id, i.Id);
                    var update = Builders<Inventar>.Update.Set(x => x.RezervisanaKolicina, i.RezervisanaKolicina);
                    updates.Add(new UpdateOneModel<Inventar>(filter, update));
                }

                if (updates.Count > 0)
                {
                    var result = await _inventar.BulkWriteAsync(updates);
                    inv_changed = result.ModifiedCount > 0;
                }
            }

            if (status == Status.DOSTAVLJENA && p.Status == Status.POSLATA)
            {
                List<Inventar> inv = new List<Inventar>();
                foreach (var item in p.Stavke)
                {
                    var i = await _inventar.Find(c => c.ProizvodID == item.ProizvodID).FirstOrDefaultAsync();
                    if (i == null) throw new Exception($"Nepostojeci proizvod {item.ProizvodINaziv}");
                    if ((i.Kolicina - i.RezervisanaKolicina) < item.Kolicina) throw new Exception($"Nedovoljno na stanju {item.ProizvodINaziv}");
                    i.RezervisanaKolicina -= item.Kolicina;
                    i.Kolicina -= item.Kolicina;
                    inv.Add(i);
                }

                var updates = new List<WriteModel<Inventar>>();

                foreach (var i in inv)
                {
                    var filter = Builders<Inventar>.Filter.Eq(x => x.Id, i.Id);
                    var update = Builders<Inventar>.Update.Set(x => x.RezervisanaKolicina, i.RezervisanaKolicina).Set(x => x.Kolicina, i.Kolicina);
                    updates.Add(new UpdateOneModel<Inventar>(filter, update));
                }

                if (updates.Count > 0)
                {
                    var result = await _inventar.BulkWriteAsync(updates);
                    inv_changed = result.ModifiedCount > 0;
                }
            }

            if (status == Status.VRACENA && p.Status == Status.DOSTAVLJENA)
            {
                List<Inventar> inv = new List<Inventar>();
                foreach (var item in p.Stavke)
                {
                    var i = await _inventar.Find(c => c.ProizvodID == item.ProizvodID).FirstOrDefaultAsync();
                    if (i == null) throw new Exception($"Nepostojeci proizvod {item.ProizvodINaziv}");
                    if ((i.Kolicina - i.RezervisanaKolicina) < item.Kolicina) throw new Exception($"Nedovoljno na stanju {item.ProizvodINaziv}");
                    i.Kolicina += item.Kolicina;
                    inv.Add(i);
                }

                var updates = new List<WriteModel<Inventar>>();

                foreach (var i in inv)
                {
                    var filter = Builders<Inventar>.Filter.Eq(x => x.Id, i.Id);
                    var update = Builders<Inventar>.Update.Set(x => x.Kolicina, i.Kolicina);
                    updates.Add(new UpdateOneModel<Inventar>(filter, update));
                }

                if (updates.Count > 0)
                {
                    var result = await _inventar.BulkWriteAsync(updates);
                    inv_changed = result.ModifiedCount > 0;
                }
            }

            if (inv_changed) 
            {
                p.Status = status;
                var result = await _porudzbine.ReplaceOneAsync(p => p.Id == id, p);
                return result.ModifiedCount > 0;
            }
            else return false;
        }
    }
}
