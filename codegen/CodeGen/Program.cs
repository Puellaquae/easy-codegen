using CodeGen;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CodeGen
{
    public class Field
    {
        public enum Type
        {
            Int,
            String,
            Blob,
            UserDef
        };

        public static Type GetTypeFromString(string value)
        {
            return value switch
            {
                "Int" => Type.Int,
                "String" => Type.String,
                "Blob" => Type.Blob,
                _ => Type.UserDef
            };
        }

        private readonly Table table;
        public string name;
        public Type type;
        private bool isArrayOfType = false;
        public Table? userDef = null;
        public Field? dependForigenLink = null;

        /// <summary>
        /// ? mark, if isUnique is true, isNullable must false
        /// </summary>
        private bool isNullable = false;

        /// <summary>
        /// @ mark, if isPrimaryKey is true, isNullable must true
        /// </summary>
        private bool isUnique = false;
        private bool isPrimaryKey = false;
        /// <summary>
        /// internal assign when resolve direct link and array link
        /// </summary>
        public bool isForeignKey = false;
        /// <summary>
        /// for who isForeignKey, link the field
        /// during resolve direck link, a new foreign key field would created, pointer to that 
        /// </summary>
        public Field? foreignLink = null;
        /// <summary>
        /// for who array of type, link the table,
        /// **attention** the usage different of foreignLink
        /// during resolve array link, a new table would created, pointer to that
        /// </summary>
        public Table? arrayLink = null;
        /// <summary>
        /// auto-gened field for foreign link is invisible for user
        /// </summary>
        public bool hidden = false;

        public class IntRange
        {
            public int? start = null;
            public int? end = null;
        }
        public IntRange? intRange = null;
        public List<string>? strEnum = null;

        public bool IsNullable { get => !isUnique && isNullable; set => isNullable = value; }
        public bool IsUnique { get => IsPrimaryKey || isUnique; set => isUnique = value; }
        public bool IsPrimaryKey { get => isPrimaryKey; set => isPrimaryKey = value; }
        /// <summary>
        /// is int or string, not any array
        /// </summary>
        public bool IsBasicType { get => type != Type.UserDef && IsArrayOfType == false; }
        public bool IsIntType { get => type == Type.Int && IsArrayOfType == false; }
        public bool IsArrayOfType { get => isArrayOfType; set => isArrayOfType = value; }
        /// <summary>
        /// if is int primary key, and not foreign key, use auto increment
        /// </summary>
        public bool IsAutoIncrement { get => IsPrimaryKey && !isForeignKey && type == Type.Int; }
        public Table OwnerTable => table;

        public Field(Table ownerTable, string name, Type type)
        {
            table = ownerTable;
            this.name = name;
            this.type = type;
        }

        public string TypeName
        {
            get
            {
                if (type == Type.String)
                {
                    return "String";
                }
                else if (type == Type.Int)
                {
                    return "Int";
                }
                else if (type == Type.Blob)
                {
                    return "Blob";
                }
                else
                {
                    return userDef!.name;
                }
            }
        }

        public string FullName { get => $"{OwnerTable.name}::{name}"; }

        public override string ToString()
        {
            StringBuilder sb = new();
            sb.Append(OwnerTable.name);
            sb.Append("::");
            sb.Append(name);
            sb.Append(": ");
            sb.Append(TypeName);
            if (IsArrayOfType)
            {
                sb.Append("[]");
            }
            sb.Append(' ');
            if (IsUnique)
            {
                sb.Append("UNIQUE ");
            }
            if (IsPrimaryKey)
            {
                sb.Append("PRIMARY ");
            }
            if (IsNullable)
            {
                sb.Append("NULLABLE ");
            }
            if (type == Type.Int && intRange != null)
            {
                if (intRange.start != null && intRange.end != null)
                {
                    sb.Append($"CHECK {intRange.start} < {name} AND {name} < {intRange.end}");
                }
                else if (intRange.start == null && intRange.end != null)
                {
                    sb.Append($"CHECK {name} < {intRange.end}");
                }
                else if (intRange.start != null && intRange.end == null)
                {
                    sb.Append($"CHECK {intRange.start} < {name}");
                }
            }
            else if (type == Type.String && strEnum != null)
            {
                string check = string.Join(" OR ", strEnum.Select(x => $"{name} == {x}"));
                sb.Append($"CHECK {check}");
            }
            if (isForeignKey)
            {
                sb.Append($"~> {foreignLink!.FullName}");
            }
            return sb.ToString();
        }

        public string ToSQL()
        {
            StringBuilder sb = new();
            sb.Append($"\"{name}\" ");
            if (type == Type.Int)
            {
                sb.Append("INTEGER");
            }
            else if (type == Type.String)
            {
                sb.Append("TEXT");
            }
            else if (type == Type.Blob)
            {
                sb.Append("BLOB");
            }
            else
            {
                throw new Exception("UserDef Type Unsupport Generate SQL");
            }
            if (!IsNullable)
            {
                sb.Append(" NOT NULL");
            }
            if (IsUnique)
            {
                sb.Append(" UNIQUE");
            }
            if (type == Type.Int && intRange != null)
            {
                if (intRange.start != null && intRange.end != null)
                {
                    sb.Append($" CHECK({intRange.start} < \"{name}\" AND \"{name}\" < {intRange.end})");
                }
                else if (intRange.start == null && intRange.end != null)
                {
                    sb.Append($" CHECK(\"{name}\" < {intRange.end})");
                }
                else if (intRange.start != null && intRange.end == null)
                {
                    sb.Append($" CHECK({intRange.start} < \"{name}\")");
                }
            }
            else if (type == Type.String && strEnum != null)
            {
                string check = string.Join(" OR ", strEnum.Select(x => $"\"{name}\" = {x}"));
                sb.Append($" CHECK({check})");
            }
            return sb.ToString();
        }
    }

    public class Table
    {
        public string name;
        public readonly List<Field> fields = new();
        private readonly Dictionary<string, Field> fieldMap = new();
        private HashSet<Field>? primaryKey = null;

        public HashSet<Table> directLink = new();
        public HashSet<Table> arrayLink = new();

        public HashSet<Field> PrimaryKey
        {
            get
            {
                if (primaryKey == null)
                {
                    PrimaryKeyResolve();
                    primaryKey = fields.Where(f => f.IsPrimaryKey).ToHashSet();
                }
                return primaryKey;
            }
        }

        public Table(string name)
        {
            this.name = name;
        }

        public Field AddField(Field field)
        {
            fields.Add(field);
            fieldMap.Add(field.name, field);
            return field;
        }

        public Field? GetField(string name)
        {
            return fieldMap[name];
        }

        public Field PrimaryKeyResolve()
        {
            // skip if had primary key
            var primaryKey = fields.FirstOrDefault(f => f.IsPrimaryKey);
            if (primaryKey != null)
            {
                return primaryKey;
            }
            // if has Id@ and type is basic type, it's primary key
            var fieldId = fields.FirstOrDefault(f => f.name == "Id" && f.IsUnique && f.IsBasicType);
            if (fieldId != null)
            {
                fieldId.IsPrimaryKey = true;
                return fieldId;
            }
            // else use first Int@ as primary ket
            var uniqueField = fields.FirstOrDefault(f => f.IsUnique && f.IsIntType);
            if (uniqueField != null)
            {
                uniqueField.IsPrimaryKey = true;
                return uniqueField;
            }
            // bad code if has named "Id" field
            if (fields.Any(f => f.name == "Id"))
            {
                throw new Exception($"{name} 中 Id 已被占用");
            }
            // add Id: Int@
            var newPrimaryKey = AddField(new Field(this, "Id", Field.Type.Int)
            {
                IsPrimaryKey = true,
            });
            return newPrimaryKey;
        }

        public void ResolveDirectForeignLink()
        {
            List<Field> newFields = new();
            foreach (var field in fields)
            {
                if (field.type == Field.Type.UserDef)
                {
                    directLink.Add(field.userDef!);
                    // combine primary key con't generater by user
                    Field priKey = field.userDef!.PrimaryKey.First();
                    Field fieldForeign = new(field.OwnerTable, $"{field.name}.{priKey.name}", priKey.type)
                    {
                        isForeignKey = true,
                        foreignLink = priKey
                    };
                    field.dependForigenLink = fieldForeign;

                    if (field.IsUnique)
                    {
                        fieldForeign.IsUnique = true;
                    }
                    if (field.IsNullable)
                    {
                        fieldForeign.IsNullable = true;
                    }

                    newFields.Add(fieldForeign);
                }
            }
            foreach (var field in newFields)
            {
                AddField(field);
            }
        }

        public override string ToString()
        {
            StringBuilder sb = new();

            sb.Append("TABLE ");
            sb.Append(name);
            if (primaryKey != null)
            {
                sb.Append($" PRIMARY KEY: {string.Join(", ", primaryKey.Select(p => p.name))}");
            }
            sb.AppendLine();
            foreach (Field field in fields)
            {
                sb.AppendLine(field.ToString());
            }
            return sb.ToString();
        }

        public string GenerateSQL()
        {
            string fieldsSql = string.Join(",\n", fields.Where(f => f.type != Field.Type.UserDef).Select(f => "    " + f.ToSQL()));
            string priKey;
            if (PrimaryKey.Count == 1)
            {
                if (PrimaryKey.First().IsAutoIncrement)
                {
                    priKey = $"    PRIMARY KEY(\"{PrimaryKey.First().name}\" AUTOINCREMENT)";
                }
                else
                {
                    priKey = $"    PRIMARY KEY(\"{PrimaryKey.First().name}\")";
                }
            }
            else
            {
                string pris = string.Join(", ", PrimaryKey.Select(f => $"\"{f.name}\""));
                priKey = $"    PRIMARY KEY({pris})";
            }
            string foreignKeys = string.Join(",\n", fields.Where(f => f.isForeignKey).Select(f => $"    FOREIGN KEY(\"{f.name}\") REFERENCES \"{f.foreignLink!.OwnerTable.name}\"(\"{f.foreignLink!.name}\")"));
            return $"CREATE TABLE \"{name}\" (\n{string.Join(",\n", new string[] { fieldsSql, priKey, foreignKeys }.Where(s => s.Length != 0))}\n);\n";
        }
    }

    public class Database
    {
        public List<Table> tables = new();
        public Dictionary<string, Table> tablesByName = new();

        public Database(List<RawTable> rawTables)
        {
            foreach (RawTable rawTable in rawTables)
            {
                Table table = new(rawTable.Name);
                tables.Add(table);
                tablesByName.Add(rawTable.Name, table);
            }

            foreach (RawTable rawTable in rawTables)
            {
                Table table = tablesByName[rawTable.Name];
                foreach (RawField rawField in rawTable.Fields)
                {
                    Field field = new(table, rawField.Name, Field.GetTypeFromString(rawField.Type))
                    {
                        IsArrayOfType = rawField.IsArray,
                        IsUnique = rawField.IsUnique,
                        IsNullable = rawField.IsNullable,
                    };
                    if (field.type == Field.Type.UserDef)
                    {
                        field.userDef = tablesByName[rawField.Type];
                    }
                    if (field.type == Field.Type.Int && (rawField.IntRangeStart != null || rawField.IntRangeEnd != null))
                    {
                        field.intRange = new Field.IntRange()
                        {
                            start = rawField.IntRangeStart,
                            end = rawField.IntRangeEnd,
                        };
                    }
                    else if (field.type == Field.Type.String && rawField.StrEnum != null)
                    {
                        field.strEnum = rawField.StrEnum;
                    }
                    table.AddField(field);
                }
            }
        }

        /// <summary>
        /// should call ResolveDirectForeignLink first.
        /// 
        /// if A has array of B, scribe as A => B,
        /// would created table C,
        /// C has foreign key to A, scribe as left foreign key,
        /// C has foreign key to B, scribe as right foreign key,
        /// if unique, combine left and right foreign key as primary key,
        /// if nullable, new primary key, right foreign key nullable,
        /// else new primary key.
        /// 
        /// if A has array of basic type T,
        /// would created table C,
        /// C has foreign key to A, 
        /// C has basic type T,
        /// if unique, combine A and T as primary key,
        /// if nullbale new primary key, T is nullable,
        /// else new primary key.
        /// </summary>
        public void ResolveArrayType()
        {
            List<Table> newTables = new();
            foreach (var table in tables)
            {
                foreach (var field in table.fields)
                {
                    if (field.IsArrayOfType && field.type == Field.Type.UserDef)
                    {
                        Table linkTable = field.userDef!;
                        table.arrayLink.Add(linkTable);
                        Table newTable = new($"{table.name}.{field.name}.{linkTable.name}");
                        field.arrayLink = newTable;
                        newTables.Add(newTable);
                        Field leftPriKey = table.PrimaryKey.First();
                        Field rightPriKey = linkTable.PrimaryKey.First();
                        if (field.IsUnique)
                        {
                            newTable.AddField(new Field(newTable, $"{table.name}::{leftPriKey.name}", leftPriKey.type)
                            {
                                IsPrimaryKey = true,
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            newTable.AddField(new Field(newTable, $"{linkTable.name}::{rightPriKey.name}", rightPriKey.type)
                            {
                                IsPrimaryKey = true,
                                isForeignKey = true,
                                foreignLink = rightPriKey
                            });
                        }
                        else if (field.IsNullable)
                        {
                            newTable.AddField(new Field(newTable, $"{table.name}::{leftPriKey.name}", leftPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            newTable.AddField(new Field(newTable, $"{linkTable.name}::{rightPriKey.name}", rightPriKey.type)
                            {
                                IsNullable = true,
                                isForeignKey = true,
                                foreignLink = rightPriKey
                            });
                        }
                        else
                        {
                            newTable.AddField(new Field(newTable, $"{table.name}::{leftPriKey.name}", leftPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            newTable.AddField(new Field(newTable, $"{linkTable.name}::{rightPriKey.name}", rightPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = rightPriKey
                            });
                        }
                    }
                    else if (field.IsArrayOfType)
                    {
                        Table dataTable = new($"{table.name}.{field.name}.{field.TypeName}");
                        table.arrayLink.Add(dataTable);
                        field.arrayLink = dataTable;
                        newTables.Add(dataTable);
                        Field leftPriKey = table.PrimaryKey.First();
                        if (field.IsUnique)
                        {
                            dataTable.AddField(new Field(dataTable, $"{table.name}::{leftPriKey.name}", leftPriKey.type)
                            {
                                IsPrimaryKey = true,
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            dataTable.AddField(new Field(dataTable, $"{table.name}::{leftPriKey.name}.value", field.type)
                            {
                                IsPrimaryKey = true,
                            });
                        }
                        else if (field.IsNullable)
                        {
                            dataTable.AddField(new Field(dataTable, $"{table.name}::{leftPriKey.name}", leftPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            dataTable.AddField(new Field(dataTable, $"{table.name}::{leftPriKey.name}.value", field.type)
                            {
                                IsNullable = true,
                            });
                        }
                        else
                        {
                            dataTable.AddField(new Field(dataTable, $"{table.name}::{leftPriKey.name}", leftPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            dataTable.AddField(new Field(dataTable, $"{table.name}::{leftPriKey.name}.value", field.type));
                        }
                    }
                }
            }
            foreach (var table in newTables)
            {
                AddTable(table);
            }
        }

        public Table AddTable(Table table)
        {
            tables.Add(table);
            tablesByName.Add(table.name, table);
            return table;
        }
    }

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

internal class Program
{
    private static void Main(string[] args)
    {
        string basePath = "../../../../../";
        string parsedJsonPath = Path.Combine(basePath, "processing-data/parsed.ecg2");

        List<RawTable> raw = JsonSerializer.Deserialize<List<RawTable>>(File.ReadAllText(parsedJsonPath))!;

        Database database = new(raw);
        Console.WriteLine("==========");
        foreach (Table table in database.tables)
        {
            _ = table.PrimaryKey;
        }
        Console.WriteLine("==========");
        foreach (Table table in database.tables)
        {
            table.ResolveDirectForeignLink();
        }
        Console.WriteLine("==========");
        database.ResolveArrayType();
        foreach (Table table in database.tables)
        {
            _ = table.PrimaryKey;
            Console.Write($"{table}\n");
        }
        Console.WriteLine("==========");
        foreach (Table table in database.tables)
        {
            Console.Write($"{table.GenerateSQL()}\n");
        }
    }
}
