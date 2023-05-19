namespace SExpr
{
    public class TypedSExpr
    {
        public string Type { get; set; }

        public static TypedSExpr FromSimpleSExpr(Dictionary<string, Func<string[], string>> gFnSigns, Dictionary<(string, string[]), string> fnSigns, Dictionary<string, string> paramTypes, SimpleSExpr expr)
        {
            if (expr is SimpleSExprUnit unit)
            {
                if (unit.Value.StartsWith('$'))
                {
                    string val = unit.Value.Substring(1);
                    string type = paramTypes[val];
                    return new TypedSExprUnit(TypedSExprUnit.Kinds.Param, val)
                    {
                        Type = type,
                    };
                }
                else
                {
                    return new TypedSExprUnit(TypedSExprUnit.Kinds.Value, unit.Value)
                    {
                        Type = unit.Value,
                    };
                }
            }
            else if (expr is SimpleSExprList list)
            {
                var rest = list.sExprs.Select(s => FromSimpleSExpr(gFnSigns, fnSigns, paramTypes, s)).ToArray();
                var paramType = rest.Skip(1).Select(s => s.Type).ToArray();
                string retType;
                if (gFnSigns.ContainsKey(rest[0].Type))
                {
                    retType = gFnSigns[rest[0].Type](paramType);
                }
                else
                {
                    retType = fnSigns[(rest[0].Type, paramType)];
                }
                return new TypedSExprList(rest)
                {
                    Type = retType
                };
            }
            else
            {
                throw new Exception("Unreachable");
            }
        }

        public override string ToString()
        {
            if (this is TypedSExprList list)
            {
                string content = string.Join(" ", list.sExprs.Select(s => s.ToString()));
                return $"({content})<{list.Type}>";
            }
            else if (this is TypedSExprUnit unit)
            {
                if (unit.Kind == TypedSExprUnit.Kinds.Param)
                {
                    return $"${unit.Value}<{unit.Type}>";
                }
                else
                {
                    return $"{unit.Value}<{unit.Type}>";
                }
            }
            else
            {
                throw new Exception("Unreachable");
            }
        }
    }
}