using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Shop.Entities
{
    public class Proizvod
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("naziv")]
        public string Naziv { get; set; } = string.Empty;

        [BsonElement("opis")]
        public string Opis { get; set; } = string.Empty;

        [BsonElement("cena")]
        public int Cena { get; set; } = 0;

        [BsonElement("kategorijaID")]
        public string KategorijaID { get; set; } = string.Empty;
    }
}
