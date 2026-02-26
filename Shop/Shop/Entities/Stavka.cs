using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Shop.Entities
{
    public class Stavka
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("proizvodID")]
        public string ProizvodID { get; set; } = string.Empty;

        [BsonElement("proizvodNaziv")]
        public string ProizvodINaziv { get; set; } = string.Empty;

        [BsonElement("kolicina")]
        public int Kolicina { get; set; } = 0;

        [BsonElement("cena")]
        public int Cena { get; set; } = 0;

    }
}
