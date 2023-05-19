namespace SExpr
{
    public class SimpleSExprParser
    {
        private readonly string input;
        private int position;

        public SimpleSExprParser(string input)
        {
            this.input = input;
            this.position = 0;
        }

        public SimpleSExpr Parse()
        {
            SkipWhiteSpace();
            if (position >= input.Length)
            {
                throw new ArgumentException("Unexpected end of input");
            }

            var nextChar = input[position];
            if (nextChar == '(')
            {
                return ParseSExprList();
            }
            else
            {
                return ParseSExprUnit();
            }
        }

        private void SkipWhiteSpace()
        {
            while (position < input.Length && char.IsWhiteSpace(input[position]))
            {
                position++;
            }
        }

        private SimpleSExprList ParseSExprList()
        {
            position++; // skip '('
            var sExprs = new List<SimpleSExpr>();

            while (true)
            {
                SkipWhiteSpace();
                if (input[position] == ')')
                {
                    position++; // skip ')'
                    return new SimpleSExprList(sExprs.ToArray());
                }
                else
                {
                    sExprs.Add(Parse());
                }
            }
        }

        private SimpleSExprUnit ParseSExprUnit()
        {
            var start = position;
            while (position < input.Length && input[position] != ' ' && input[position] != ')')
            {
                position++;
            }

            return new SimpleSExprUnit(input.Substring(start, position - start));
        }
    }
}