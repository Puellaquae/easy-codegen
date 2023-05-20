using SExpr;
using System.Text;

namespace SQLGen
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

        public string SQLIdent
        {
            get
            {
                return $"{OwnerTable.SQLType}.{name}";
            }
        }
        public string SQLType
        {
            get
            {
                if (type == Type.UserDef)
                {
                    return $"{userDef!.SQLType}";
                }
                return $"{OwnerTable.SQLType}.{name}";
            }
        }
        public string SQLArrayOfType { get => SQLType.ArrayOfType(); }
    }

}
