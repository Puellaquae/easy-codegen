using CodeGen;
using System.Text.Json;

internal class Program
{
    private static void Main(string[] args)
    {
        string? basePath = null;
        string? inFile = null;
        string? outFile = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--basedir" && i + 1 < args.Length)
            {
                basePath = args[i + 1];
            }
            else if (args[i] == "--in" && i + 1 < args.Length)
            {
                inFile = args[i + 1];
            }
            else if (args[i] == "--out" && i + 1 < args.Length)
            {
                outFile = args[i + 1];
            }
        }

        basePath ??= "../../processing-data/";
        inFile ??= "parsed.ecg2";

        string parsedJsonPath = Path.Combine(basePath, inFile);

        Console.WriteLine($"CodeGen, Input: {Path.GetFullPath(parsedJsonPath)}");
        
        List<RawTable> raw = JsonSerializer.Deserialize<List<RawTable>>(File.ReadAllText(parsedJsonPath))!;
        
        Console.WriteLine("Load File");
        Database database = new(raw);

        Console.WriteLine("Resolve Primary Key");
        foreach (Table table in database.tables)
        {
            _ = table.PrimaryKey;
        }

        Console.WriteLine("Resolve UserDef Type");
        foreach (Table table in database.tables)
        {
            table.ResolveDirectForeignLink();
        }

        Console.WriteLine("Resolve Array Type");
        database.ResolveArrayType();
        foreach (Table table in database.tables)
        {
            _ = table.PrimaryKey;
        }

        Console.WriteLine("Generate SQL Table Create Script");
        foreach (Table table in database.tables)
        {
            Console.Write($"{table.GenerateSQL()}\n");
        }
    }
}
