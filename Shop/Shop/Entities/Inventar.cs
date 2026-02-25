using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Shop.Entities
{
    public class Inventar
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("proizvodID")]
        public string ProizvodID { get; set; } = string.Empty;

        [BsonElement("kolicina")]
        public int Kolicina { get; set; } = 0;

    }
}
