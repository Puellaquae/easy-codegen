using SExpr;
using System.Text;

namespace SQLGen
{
    public class Table
    {
        public string name;
        public readonly List<Field> fields = new();
        private readonly Dictionary<string, Field> fieldMap = new();
        private HashSet<Field>? primaryKey = null;


        /// <summary>
        /// if the table is auto-gened, it's hidden for developer
        /// </summary>
        public bool Hidden { get; set; } = false;

        public HashSet<Table> directLink = new();
        public HashSet<Table> arrayLink = new();

        public HashSet<Field> PrimaryKey
        {
            get
            {
                if (primaryKey == null)
                {
                    _ = PrimaryKeyResolve();
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
                        foreignLink = priKey,
                        hidden = true
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

        public string SQLIdent { get => name; }
        public string SQLType { get => name; }
        public string SQLArrayOfType { get => SQLType.ArrayOfType(); }
    }
}
