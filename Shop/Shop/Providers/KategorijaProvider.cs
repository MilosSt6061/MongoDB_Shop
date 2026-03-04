using MongoDB.Bson;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Shop.Entities;
using WebShop.Configuration;

namespace Shop.Providers
{
    public class KategorijaProvider
    {
        private readonly IMongoCollection<Kategorija> _kategorije;
        private readonly IMongoCollection<Proizvod> _proizvodi;

        public KategorijaProvider(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _kategorije = database.GetCollection<Kategorija>(settings.Value.KategorijaCollectionName);
            _proizvodi = database.GetCollection<Proizvod>(settings.Value.ProizvodCollectionName);
        }

        public async Task<List<Kategorija>> VratiSveKategorije()
        {
            return await _kategorije.Find(Builders<Kategorija>.Filter.Empty).ToListAsync();
        }

        public async Task<bool> KreirajKategoriju(Kategorija kategorija)
        {
            kategorija.Id = null;
            await _kategorije.InsertOneAsync(kategorija);
            return true;
        }

        public async Task<bool> IzmeniKategoriju(Kategorija kategorija)
        {
            var item = await _kategorije.Find(k => k.Id == kategorija.Id).FirstOrDefaultAsync();
            if(item == null) throw new Exception($"Nepostojeca kategorija {kategorija.Naziv}");
            var result = await _kategorije.ReplaceOneAsync(k => k.Id == kategorija.Id, kategorija);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ObrisiKategoriju(string kategorijaID)
        {
            var item = await _kategorije.Find(k => k.Id == kategorijaID).FirstOrDefaultAsync();
            if(item == null) throw new Exception("Nepostojeca kategorija");
            var result = await _kategorije.DeleteOneAsync(k => k.Id == kategorijaID);
            if(result.DeletedCount == 0) return false;
            var res = await _proizvodi.DeleteManyAsync(p => p.KategorijaID == kategorijaID);
            return res.DeletedCount > 0;
        }
    }
}