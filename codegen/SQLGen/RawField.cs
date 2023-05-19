using System.Text;
using System.Text.Json.Serialization;

namespace SQLGen
{
    public class RawField
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
        [JsonPropertyName("type")]
        public string Type { get; set; } = "";
        [JsonPropertyName("is_array")]
        public bool IsArray { get; set; }
        [JsonPropertyName("is_unique")]
        public bool IsUnique { get; set; }
        [JsonPropertyName("is_nullable")]
        public bool IsNullable { get; set; }
        [JsonPropertyName("int_range_start")]
        public int? IntRangeStart { get; set; }
        [JsonPropertyName("int_range_end")]
        public int? IntRangeEnd { get; set; }
        [JsonPropertyName("str_enum")]
        public List<string>? StrEnum { get; set; }

        public override string ToString()
        {
            StringBuilder sb = new();
            sb.Append(Name);
            sb.Append(':');
            sb.Append(IsArray ? "[]" : "");
            sb.Append(IsUnique ? "@" : "");
            sb.Append(IsNullable ? "?" : "");
            sb.Append(Type);
            if (Type == "Int" && (IntRangeStart != null || IntRangeEnd != null))
            {
                sb.Append('{');
                if (IntRangeStart != null)
                {
                    sb.Append(IntRangeStart);
                }
                sb.Append("..");
                if (IntRangeEnd != null)
                {
                    sb.Append(IntRangeEnd);
                }
                sb.Append('}');
            }
            else if (Type == "String" && (StrEnum != null))
            {
                sb.Append('{');
                sb.Append(string.Join(",", StrEnum.Select(x => $"\"{x}\"")));
                sb.Append('}');
            }
            return sb.ToString();
        }
    }

}
