using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Shop.Entities;
using WebShop.Configuration;

namespace Shop.Providers
{
    public class InventarProvider
    {
        private readonly IMongoCollection<Inventar> _inventar;

        public InventarProvider(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _inventar = database.GetCollection<Inventar>(settings.Value.InventarCollectionName);
        }

        public async Task<int> VratiKolicinuZaProizvod(string proizvodID)
        {
            var item = await _inventar.Find(i => i.ProizvodID == proizvodID).FirstOrDefaultAsync();
            if(item == null) throw new Exception("Nepostojeci proizvod");
            return item.Kolicina;
        }

        public async Task<int> VratiUkupnuKolicinuZaProizvod(string proizvodID)
        {
            var item = await _inventar.Find(i => i.ProizvodID == proizvodID).FirstOrDefaultAsync();
            if(item == null) throw new Exception("Nepostojeci proizvod");
            return item.Kolicina + item.RezervisanaKolicina;
        }

        public async Task<bool> IzmeniKolicinuProizvoda(string proizvodID, int kolicina)
        {
            var item = await _inventar.Find(i => i.ProizvodID == proizvodID).FirstOrDefaultAsync();
            if(item == null) throw new Exception("Nepostojeci proizvod");
            var filter = Builders<Inventar>.Filter.Eq(i => i.ProizvodID, proizvodID);
            var update = Builders<Inventar>.Update.Set(i => i.Kolicina, kolicina);
            var result = await _inventar.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}