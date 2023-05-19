namespace SExpr
{
    public class TypedSExprUnit : TypedSExpr
    {
        public enum Kinds
        {
            Param,
            Value
        }

        public Kinds Kind { get; set; }
        public string Value { get; set; }

        public TypedSExprUnit(Kinds kind, string value)
        {
            Kind = kind;
            Value = value;
        }
    }
}