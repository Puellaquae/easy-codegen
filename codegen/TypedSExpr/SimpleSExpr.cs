namespace SExpr
{
    public class SimpleSExpr
    {
        public override string ToString()
        {
            if (this is SimpleSExprUnit unit)
            {
                return unit.Value;
            }
            else if (this is SimpleSExprList list)
            {
                string content = string.Join(" ", list.sExprs.Select(x => x.ToString()));
                return $"({content})";
            }
            else
            {
                throw new Exception("Unreachable");
            }
        }

        public static SimpleSExpr Simplify(SimpleSExpr expr)
        {
            if (expr is SimpleSExprList list && list.sExprs.Count == 1)
            {
                return Simplify(list.sExprs[0]);
            }
            else if (expr is SimpleSExprList list1)
            {
                var sExprs = new List<SimpleSExpr>();
                foreach (var item in list1.sExprs)
                {
                    sExprs.Add(Simplify(item));
                }
                return new SimpleSExprList(sExprs.ToArray());
            }
            else
            {
                return expr;
            }
        }
    }
}