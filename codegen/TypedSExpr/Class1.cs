using SExpr;

namespace SExpr
{

    public interface IExpr
    {

    }

    public class Expr : IExpr
    {

    }

    public class FuncExpr : IExpr
    {

    }

    public class SQLExpr : IExpr
    {
        public string value;
        public string type;

        public SQLExpr(string value, string type)
        {
            this.value = value;
            this.type = type;
        }
    }

    public class SQLFuncExpr : IExpr
    {
        public string[] paramTypes;
        public string type;
        public string expr;

        public SQLFuncExpr(string expr, string type, params string[] paramTypes)
        {
            this.paramTypes = paramTypes;
            this.type = type;
            this.expr = expr;
        }
    }

    public static class DictHelper
    {
        public static void DictCreateListIfNot<K, T>(this Dictionary<K, List<T>> dict, K key, T val) where K : notnull
        {
            if (!dict.ContainsKey(key))
            {
                dict.Add(key, new List<T>());
            }
            dict[key].Add(val);
        }


    }

    public static class TypeHelper
    {
        public static string ArrayOfType(this string type)
        {
            return $"[{type}]";
        }
    }

}