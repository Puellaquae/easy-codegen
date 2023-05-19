namespace SExpr
{
    public class SimpleSExprUnit : SimpleSExpr
    {
        public string Value { get; set; }
        public SimpleSExprUnit(string value)
        {
            Value = value;
        }
    }
}