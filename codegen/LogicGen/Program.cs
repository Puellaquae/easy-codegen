using LogicGen;
using SExpr;
using SQLGen;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LogicGen
{
    public class RawFunction
    {
        public class Arg
        {
            [JsonPropertyName("name")]
            public string Name { get; set; } = "";
            [JsonPropertyName("ty")]
            public string? Type { get; set; }
        }
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
        [JsonPropertyName("ret_ty")]
        public string? RetType { get; set; }
        [JsonPropertyName("is_stub")]
        public bool IsStub { get; set; } = false;
        [JsonPropertyName("args")]
        public List<Arg>? Args { get; set; }
        [JsonPropertyName("exprs")]
        public List<string>? Exprs { get; set; }
    }
}

internal class Program
{
    public class RawData
    {
        [JsonPropertyName("entities")]
        public List<RawTable>? Entities { get; set; }

        [JsonPropertyName("fns")]
        public List<RawFunction>? Fns { get; set; }
    }

    string Apply(SimpleSExpr expr, Dictionary<string, Func<string[], string>> fns)
    {
        if (expr is SimpleSExprUnit unit)
        {
            return unit.Value;
        }
        else if (expr is SimpleSExprList list)
        {
            string fn = (list.sExprs[0] as SimpleSExprUnit ?? throw new NotSupportedException()).Value;
            return fns[fn](list.sExprs.Skip(1).Select(s => Apply(s, fns)).ToArray());
        }
        else
        {
            throw new Exception("Unreachable");
        }
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

        List<RawFunction> rawFunctions = raw.Fns!;
        Database database = new(raw.Entities!);

        foreach (RawFunction function in rawFunctions)
        {
            if (function.Exprs != null)
            {
                Console.WriteLine($"====={function.Name}=====");
                foreach (var expr in function.Exprs)
                {
                    SimpleSExpr sexpr = new SimpleSExprParser(expr).Parse();
                    SimpleSExpr sexpr1 = SimpleSExpr.Simplify(sexpr);
                    Console.WriteLine(sexpr1);
                }
            }
        }
    }
}