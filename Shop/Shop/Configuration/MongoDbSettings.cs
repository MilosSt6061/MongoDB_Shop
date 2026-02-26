namespace WebShop.Configuration
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = "mongodb://localhost:27017";
        public string DatabaseName { get; set; } = "Shop";
        public string ProizvodCollectionName { get; set; } = "Proizvodi";
        public string KorpaCollectionName { get; set; } = "Korpe";
        public string PorudzbinaCollectionName { get; set; } = "Porudzbine";
        public string KorisnikCollectionName { get; set; } = "Korisnici";
        public string InventarCollectionName { get; set; } = "Inventar";
        public string KategorijaCollectionName { get; set; } = "Kategorije";
    }
}