using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;
using Shop.DTO;

namespace Shop.Entities
{
    public class Porudzbina
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

        [BsonElement("vremeKreiranja")]
        public DateTime VremeKreiranja { get; set; }

        [BsonElement("status")]
        [BsonRepresentation(BsonType.String)]
        public Status Status { get; set; }
    }
}
