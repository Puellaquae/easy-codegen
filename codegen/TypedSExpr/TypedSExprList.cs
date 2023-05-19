namespace SExpr
{
    public class TypedSExprList : TypedSExpr
    {
        public List<TypedSExpr> sExprs;

        public TypedSExprList(params TypedSExpr[] sExprs)
        {
            this.sExprs = sExprs.ToList();
        }
    }
}