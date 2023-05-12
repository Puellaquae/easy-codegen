using System.Text;
using System.Text.Json.Serialization;

namespace CodeGen
{
    public class RawTable
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
        [JsonPropertyName("fields")]
        public List<RawField> Fields { get; set; } = new List<RawField>();

        public override string ToString()
        {
            StringBuilder sb = new();
            sb.AppendLine($"entity {Name} {{");
            foreach (RawField field in Fields)
            {
                sb.AppendLine(field.ToString());
            }
            sb.AppendLine("}");
            return sb.ToString();
        }
    }

}
