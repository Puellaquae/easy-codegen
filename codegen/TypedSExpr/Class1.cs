using SExpr;
using System.Collections.Generic;

namespace SExpr
{

    public interface IExpr
    {
        public string ValType { get; }
        public string Val { get; }
    }

    public interface IFuncExpr
    {
        public string ValType { get; }
        public IExpr Apply(string[] param);
        public bool CheckParam(string[] param);
    }

    public class GLExpr : IExpr
    {
        public string value;
        public string type;

        public GLExpr(string value, string type)
        {
            this.value = value;
            this.type = type;
        }

        public string ValType => type;
        public string Val => value;
    }

    public class GLFuncExpr : IFuncExpr
    {
        public string[] paramTypes;
        public string type;
        public string expr;

        public string ValType => type;

        public GLFuncExpr(string expr, string type, params string[] paramTypes)
        {
            this.paramTypes = paramTypes;
            this.type = type;
            this.expr = expr;
        }

        public IExpr Apply(string[] param)
        {
            return new GLExpr(string.Format(expr, param), type);
        }

        public bool CheckParam(string[] param)
        {
            if (param.Length != paramTypes.Length)
            {
                return false;
            }
            for (int i = 0; i < param.Length; i++)
            {
                if (!paramTypes[i].FromType(param[i]))
                {
                    return false;
                }
            }
            return true;
        }
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

        public string ValType => type;
        public string Val => value;
    }

    public class SQLFuncExpr : IFuncExpr
    {
        public string[] paramTypes;
        public string type;
        public string expr;

        public string ValType => type;

        public SQLFuncExpr(string expr, string type, params string[] paramTypes)
        {
            this.paramTypes = paramTypes;
            this.type = type;
            this.expr = expr;
        }

        public IExpr Apply(string[] param)
        {
            return new SQLExpr(string.Format(expr, param), type);
        }

        public bool CheckParam(string[] param)
        {
            if (param.Length != paramTypes.Length)
            {
                return false;
            }
            for (int i = 0; i < param.Length; i++)
            {
                if (!paramTypes[i].FromType(param[i]))
                {
                    return false;
                }
            }
            return true;
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

        public static bool FromType(this string type, string type2)
        {
            return type == type2;
        }
    }

    public class FunctionContent
    {
        public string name;
        public Dictionary<string, List<IFuncExpr>> fns = new();
        public Dictionary<string, Stack<IExpr>> vars = new();
        public IExpr retExpr;

        public void AddExpr(SimpleSExpr expr)
        {
            retExpr = ParseExpr(expr);
        }

        public bool inSQLBool = false;
        public void PushVar(string varName, IExpr varExpr)
        {
            if (!vars.ContainsKey(varName))
            {
                vars.Add(varName, new Stack<IExpr>());
            }
            vars[varName].Push(varExpr);
        }

        public void PopVar(string varName)
        {
            vars[varName].Pop();
            if (vars[varName].Count == 0)
            {
                vars.Remove(varName);
            }
        }

        public IExpr ParseExpr(SimpleSExpr expr)
        {
            if (expr is SimpleSExprUnit unit)
            {
                if (vars.ContainsKey(unit.Value))
                {
                    return vars[unit.Value].Peek();
                }
                throw new Exception($"Unknown {unit}");
            }
            else if (expr is SimpleSExprList list)
            {
                var fn = list.sExprs[0];
                if (fn is SimpleSExprUnit fnUnit)
                {
                    if (inSQLBool)
                    {

                    }
                    if (fnUnit.Value == "let")
                    {
                        var varName = (list.sExprs[1] as SimpleSExprUnit ?? throw new Exception("let $1 $2, $1 is not unit")).Value;
                        PushVar(varName, ParseExpr(list.sExprs[2]));
                        return new GLExpr("", "void");
                    }
                    else if (fns.ContainsKey(fnUnit.Value))
                    {
                        var param = list.sExprs.Skip(1).Select(ParseExpr).ToArray();
                        var paramType = param.Select(p => p.ValType).ToArray();
                        var paramVal = param.Select(p => p.Val).ToArray();
                        foreach (var fnVal in fns[fnUnit.Value])
                        {
                            if (fnVal.CheckParam(paramType))
                            {
                                return fnVal.Apply(paramVal);
                            }
                        }
                        throw new Exception($"no matched {fnUnit} for {list}");
                    }
                }
                throw new Exception($"first of {list} is not Func");
            }
            throw new Exception("Unreachable");
        }
    }
}
