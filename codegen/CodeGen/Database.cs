namespace CodeGen
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

}
