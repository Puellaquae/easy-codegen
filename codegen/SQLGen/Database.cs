using SExpr;

namespace SQLGen
{
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

            Console.WriteLine("Resolve Primary Key");
            foreach (Table table in tables)
            {
                _ = table.PrimaryKey;
            }

            Console.WriteLine("Resolve UserDef Type");
            foreach (Table table in tables)
            {
                table.ResolveDirectForeignLink();
            }

            Console.WriteLine("Resolve Array Type");
            ResolveArrayType();
            foreach (Table table in tables)
            {
                _ = table.PrimaryKey;
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
                        Table newTable = new($"{table.name}.{field.name}.{linkTable.name}")
                        {
                            Hidden = true,
                        };
                        field.arrayLink = newTable;
                        newTables.Add(newTable);
                        Field leftPriKey = table.PrimaryKey.First();
                        Field rightPriKey = linkTable.PrimaryKey.First();
                        if (field.IsUnique)
                        {
                            newTable.AddField(new Field(newTable, $"{table.name}:l:{leftPriKey.name}", leftPriKey.type)
                            {
                                IsPrimaryKey = true,
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            newTable.AddField(new Field(newTable, $"{linkTable.name}:r:{rightPriKey.name}", rightPriKey.type)
                            {
                                IsPrimaryKey = true,
                                isForeignKey = true,
                                foreignLink = rightPriKey
                            });
                        }
                        else if (field.IsNullable)
                        {
                            newTable.AddField(new Field(newTable, $"{table.name}:l:{leftPriKey.name}", leftPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            newTable.AddField(new Field(newTable, $"{linkTable.name}:r:{rightPriKey.name}", rightPriKey.type)
                            {
                                IsNullable = true,
                                isForeignKey = true,
                                foreignLink = rightPriKey
                            });
                        }
                        else
                        {
                            newTable.AddField(new Field(newTable, $"{table.name}:l:{leftPriKey.name}", leftPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = leftPriKey
                            });
                            newTable.AddField(new Field(newTable, $"{linkTable.name}:r:{rightPriKey.name}", rightPriKey.type)
                            {
                                isForeignKey = true,
                                foreignLink = rightPriKey
                            });
                        }
                    }
                    else if (field.IsArrayOfType)
                    {
                        Table dataTable = new($"{table.name}.{field.name}.{field.TypeName}")
                        {
                            Hidden = true
                        };
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

        public string[] GetTypes()
        {
            List<string> types = new();
            foreach (var table in tables)
            {
                if (table.Hidden)
                {
                    continue;
                }

                types.Add(table.name);
                bool priKeyAdded = false;
                foreach (var field in table.fields)
                {
                    if (!field.hidden)
                    {
                        types.Add($"{table.name}.{field.name}");
                        if (field.name == "Id")
                        {
                            priKeyAdded = true;
                        }
                    }
                }
                if (!priKeyAdded)
                {
                    types.Add($"{table.name}.Id");
                }
            }
            return types.ToArray();
        }

        public Dictionary<string, string> GetTypeAlias()
        {
            Dictionary<string, string> pairs = new();
            foreach (var table in tables)
            {
                if (table.Hidden)
                {
                    continue;
                }
                // who has combined primary keys is only auto gened, so here must be single
                var priKey = table.PrimaryKey.FirstOrDefault();
                if (priKey != null)
                {
                    if (priKey.name != "Id")
                    {
                        pairs.Add($"{table.name}.Id", $"{table.name}.{priKey.name}");
                    }
                }
            }
            return pairs;
        }

        public Dictionary<(string, string[]), string> GetFnSigns()
        {
            Dictionary<(string, string[]), string> fns = new(new FnSignEqualityComparer());
            foreach (var table in tables)
            {
                if (table.Hidden)
                {
                    continue;
                }
                foreach (var field in table.fields)
                {
                    if (field.hidden)
                    {
                        continue;
                    }
                    fns.Add((field.name, new string[] { table.name }), $"{table.name}.{field.name}");
                    if (field.IsPrimaryKey)
                    {
                        fns.Add((table.name, new string[] { $"{table.name}.{field.name}" }), table.name);
                    }
                }
            }
            return fns;
        }

        public Dictionary<(string, string[]), string> GetFns()
        {
            Dictionary<(string, string[]), string> fns = new(new FnSignEqualityComparer());
            foreach (var table in tables)
            {
                if (table.Hidden)
                {
                    continue;
                }
                foreach (var field in table.fields)
                {
                    if (field.hidden)
                    {
                        continue;
                    }
                    fns.Add((field.name, new string[] { table.name }), $"(select $1 {table.name}.{field.name})");
                    fns.Add(($"[{field.name}]", new string[] { $"[{table.name}]" }), $"(select $1 {table.name}.{field.name})");
                    if (field.IsPrimaryKey)
                    {
                        fns.Add((table.name, new string[] { $"{table.name}.{field.name}" }), $"(typeHint (where (from {table.name}) (eq {table.name}.{field.name} $1)) {table.name})");
                        fns.Add(($"[{table.name}]", new string[] { $"[{table.name}.{field.name}]" }), $"(where (from {table.name}) (in {table.name}.{field.name} $1))");
                    }
                }
            }
            return fns;
        }

        public Dictionary<string, List<SQLFuncExpr>> GetSQLFns()
        {
            Dictionary<string, List<SQLFuncExpr>> fns = new();
            foreach (var table in tables)
            {
                if (table.Hidden)
                {
                    continue;
                }
                foreach (var field in table.fields)
                {
                    if (field.hidden)
                    {
                        continue;
                    }
                    fns.DictCreateListIfNot(
                        field.SQLType,
                        new SQLFuncExpr(
                            $"SELECT \"{field.SQLType}\" FROM ({{0}})",
                            field.SQLType,
                            table.SQLType));
                    fns.DictCreateListIfNot(
                        field.SQLArrayOfType,
                        new SQLFuncExpr(
                            $"SELECT \"{field.SQLType}\" FROM ({{0}})",
                            field.SQLArrayOfType,
                            table.SQLArrayOfType));
                    if (field.IsPrimaryKey)
                    {
                        fns.DictCreateListIfNot(table.SQLType, new SQLFuncExpr(
                            $"SELECT * FROM \"{table.SQLType}\" WHERE \"{field.SQLType}\" == ({{0}})",
                            table.SQLType,
                            field.SQLType));
                        fns.DictCreateListIfNot(table.SQLArrayOfType, new SQLFuncExpr(
                            $"SELECT * FROM \"{table.SQLType}\" WHERE \"{field.SQLType}\" IN ({{0}})",
                            table.SQLArrayOfType,
                            field.SQLArrayOfType));
                    }
                }
            }
            return fns;
        }
    }
}
