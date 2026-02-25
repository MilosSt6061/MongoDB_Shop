using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson;

namespace Shop.Entities
{
    public class Korisnik
    {

        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("username")]
        public string? Username { get; set; }

        [BsonElement("ime")]
        public string Ime { get; set; } = string.Empty;

        [BsonElement("prezime")]
        public string Prezime { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("broj")]
        public string Broj { get; set; } = string.Empty;

        [BsonElement("lozinka")]
        public string Lozinka { get; set; } = string.Empty;

    }
}
