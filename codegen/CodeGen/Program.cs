using SQLGen;
using SExpr;
using System.Text.Json;
using System.Text.Json.Serialization;

internal class Program
{
    public class RawData
    {
        [JsonPropertyName("entities")]
        public List<RawTable>? Entities { get; set; }

        [JsonPropertyName("fns")]
        public List<object>? Fns { get; set; }
    }

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
        inFile ??= "input.ecg2";

        string parsedJsonPath = Path.Combine(basePath, inFile);

        Console.WriteLine($"CodeGen, Input: {Path.GetFullPath(parsedJsonPath)}");
        Console.WriteLine("Load File");

        RawData raw = JsonSerializer.Deserialize<RawData>(File.ReadAllText(parsedJsonPath))!;
        List<RawTable> rawTable = raw.Entities!;

        Database database = new(rawTable);

        Console.WriteLine("Generate SQL Table Create Script");
        foreach (Table table in database.tables)
        {
            Console.Write($"{table.GenerateSQL()}\n");
        }

        Console.WriteLine("Types:");
        Console.WriteLine(string.Join("\n", database.GetTypes()));
        Console.WriteLine("TypeAlias:");
        Console.WriteLine(string.Join("\n", database.GetTypeAlias().Select((kv) => $"{kv.Key} => {kv.Value}")));

        Console.WriteLine("\nTypeFnSigns:");
        var fns = database.GetFnSigns();
        Console.WriteLine(string.Join("\n", fns.Select((kv) => $"{kv.Key.Item1} = {string.Join(" -> ", kv.Key.Item2)} -> {kv.Value}")));

        Console.WriteLine("\nTypeFns:");
        var fnss = database.GetFns();
        foreach (var fn in fnss)
        {
            string expr = fn.Value;
            string fname = fn.Key.Item1;
            string[] par = fn.Key.Item2;

            Console.WriteLine($"{fname} = {string.Join(" -> ", par)} = {expr}");

            SimpleSExpr simpleSExpr = new SimpleSExprParser(expr).Parse();
            SimpleSExpr sexpr = SimpleSExpr.Simplify(simpleSExpr);
            TypedSExpr texpr = TypedSExpr.FromSimpleSExpr(
                SQLGenericFnSign.GenericSigns,
                new Dictionary<(string, string[]), string>(new FnSignEqualityComparer()),
                par.Select((v, i) => (v, index: i + 1)).ToDictionary(x => x.index.ToString(), x => x.v),
                sexpr);
            Console.WriteLine(texpr);
        }

        Console.WriteLine(database.GenJSTypeDef());
    }
}
