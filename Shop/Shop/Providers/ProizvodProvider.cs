using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Shop.Entities;
using WebShop.Configuration;

namespace Shop.Providers
{
    public class ProizvodProvider
    {
        private readonly IMongoCollection<Proizvod> _proizvodi;
        private readonly IMongoCollection<Kategorija> _kategorije;
        private readonly IMongoCollection<Inventar> _inventar;

        public ProizvodProvider(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _proizvodi = database.GetCollection<Proizvod>(settings.Value.ProizvodCollectionName);
            _kategorije = database.GetCollection<Kategorija>(settings.Value.KategorijaCollectionName);
            _inventar = database.GetCollection<Inventar>(settings.Value.InventarCollectionName);
        }

        public async Task<List<Proizvod>> VratiSveProizvode()
        {
            return await _proizvodi.Find(Builders<Proizvod>.Filter.Empty).ToListAsync();
        }

        public async Task<List<Proizvod>> VratiSveProizvodePoKategoriji(string kategorijaID)
        {
            var kategorija = await _kategorije.Find(k => k.Id == kategorijaID).FirstOrDefaultAsync();
            if(kategorija == null) throw new Exception("Nepostojeca kategorija");
            return await _proizvodi.Find(p => p.KategorijaID == kategorijaID).ToListAsync();
        }

        public async Task<List<Proizvod>> VratiSveProizvodePoCeni(int cena)
        {
            var filter = Builders<Proizvod>.Filter.And(Builders<Proizvod>.Filter.Lte(p => p.Cena, cena));
            return await _proizvodi.Find(filter).ToListAsync();
        }

        public async Task<List<Proizvod>> VratiSveProizvodePoNazivu(string naziv)
        {
            return await _proizvodi.Find(p => p.Naziv.ToLower().Contains(naziv.ToLower())).ToListAsync();
        }

        public async Task<bool> KreirajProizvodInvetar(Proizvod proizvod, int kolicina)
        {
            proizvod.Id = null;
            await _proizvodi.InsertOneAsync(proizvod);

            Inventar inventar = new Inventar
            {
                Id = null,
                ProizvodID = proizvod.Id,
                Kolicina = kolicina
            };
            await _inventar.InsertOneAsync(inventar);
            return true;
        }

        public async Task<bool> IzmeniProizvod(Proizvod proizvod)
        {
            var item = await _proizvodi.Find(p => p.Id == proizvod.Id).FirstOrDefaultAsync();
            if(item == null) throw new Exception($"Nepostojeci proizvod {proizvod.Naziv}");
            var result = await _proizvodi.ReplaceOneAsync(p => p.Id == proizvod.Id, proizvod);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ObrisiProizvodInventar(string proizvodID)
        {
            var item = await _proizvodi.Find(p => p.Id == proizvodID).FirstOrDefaultAsync();
            if(item == null) throw new Exception("Nepostojeci proizvod");
            var result = await _proizvodi.DeleteOneAsync(p => p.Id == proizvodID);
            if(result.DeletedCount == 0) return false;
            var ress = await _inventar.DeleteOneAsync(i => i.ProizvodID == proizvodID);
            return ress.DeletedCount > 0;
        }
    }
}