using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Shop.Entities
{
    public class Korpa
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("username")]
        public string Username { get; set; } = string.Empty;

        [BsonElement("stavke")]
        public List<Stavka> Stavke { get; set; } = new List<Stavka>();

        [BsonElement("ukupnaCena")]
        public int UkupnaCena { get; set; }
    }
}
