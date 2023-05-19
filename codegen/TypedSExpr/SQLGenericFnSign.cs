namespace SExpr
{
    public class SQLGenericFnSign
    {
        public static Dictionary<string, Func<string[], string>> GenericSigns
        {
            get => new()
            {
                { "eq", Eq },
                { "from", From },
                { "where", Where },
                { "select", Select },
                { "in", In },
                { "typeHint", TypeHint },
            };
        }

        public static string Eq(string[] param)
        {
            if (param.Length != 2)
            {
                throw new ArgumentException("eq : T -> T -> Bool, not 2 params");
            }
            if (param[0] != param[1])
            {
                throw new ArgumentException("eq : T -> T -> Bool, T1 != T2");
            }
            return "Bool";
        }

        public static string In(string[] param)
        {
            if (param.Length != 2)
            {
                throw new ArgumentException("in : T -> [T] -> Bool, not 2 params");
            }
            if ($"[{param[0]}]" != param[1])
            {
                throw new ArgumentException("in : T -> [T] -> Bool, [T1] != T2");
            }
            return "Bool";
        }

        public static string From(string[] param)
        {
            if (param.Length != 1)
            {
                throw new ArgumentException("from : T -> [T], not 1 params");
            }
            return $"[{param[0]}]";
        }

        public static string Where(string[] param)
        {
            if (param.Length != 2)
            {
                throw new ArgumentException("where : [T] -> Bool -> [T], not 2 params");
            }
            if (!param[0].StartsWith('['))
            {
                throw new ArgumentException("where : [T] -> Bool -> [T], T1 not array");
            }
            if (param[1] != "Bool")
            {
                throw new ArgumentException("where : [T] -> Bool -> [T], T2 not bool");
            }
            return param[0];
        }

        public static string Select(string[] param)
        {
            if (param.Length != 2)
            {
                throw new ArgumentException("select : [T] -> S -> [S] | T -> S -> S, not 2 params");
            }
            if (param[0].StartsWith("["))
            {
                return $"[{param[1]}]";
            }
            return param[1];
        }

        public static string TypeHint(string[] param)
        {
            if (param.Length != 2)
            {
                throw new ArgumentException("TypeHint : T -> S -> S, not 2 params");
            }
            return param[1];
        }
    }
}