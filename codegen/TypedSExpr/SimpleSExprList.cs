namespace SExpr
{
    public class SimpleSExprList : SimpleSExpr
    {
        public List<SimpleSExpr> sExprs;

        public SimpleSExprList(params SimpleSExpr[] sExprs)
        {
            this.sExprs = sExprs.ToList();
        }
    }
}