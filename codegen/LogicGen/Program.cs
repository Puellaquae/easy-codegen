using LogicGen;
using System.Text.Json;

namespace LogicGen
{
    public class RawSExpr
    {

    }

    public class RawSExprValue : RawSExpr
    {
        public string Value { get; set; }

        public RawSExprValue(string value)
        {
            Value = value;
        }
    }

    public class RawSExprApply : RawSExpr
    {
        public List<RawSExpr> Applies { get; set; }

        public RawSExprApply(params RawSExpr[] applies)
        {
            Applies = new List<RawSExpr>(applies);
        }
    }

    public class RawFunction
    {
        public string Name { get; set; }
        public bool IsStub { get; set; } = false;
        public List<(string name, string type)> Args { get; set; }
        public List<RawSExpr> Exprs { get; set; }
    }
}

internal class Program
{
    private static void Main(string[] args)
    {
        RawFunction fn = new RawFunction()
        {
            Name = "TableOrderAppend",
            IsStub = false,
            Args = new List<(string name, string type)>
            {
                ("tid", "Table.Id"),
                ("fid", "Food.Id"),
                ("count", "Int"),
            },
            Exprs = new List<RawSExpr>()
            {
                new RawSExprApply(
                    new RawSExprValue("let"),
                    new RawSExprValue("CurOrderItems"),
                    new RawSExprApply(
                        new RawSExprValue("Items"),
                        new RawSExprApply(
                            new RawSExprValue("CurOrder"),
                            new RawSExprApply(
                                new RawSExprValue("Table"),
                                new RawSExprValue("tid")
                            )
                        )
                    )
                )
            }
        };
        string res = JsonSerializer.Serialize(fn);
        Console.WriteLine(res);
    }
}