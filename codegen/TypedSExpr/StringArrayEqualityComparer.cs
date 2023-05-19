namespace SExpr
{
    public class StringArrayEqualityComparer : IEqualityComparer<string[]>
    {
        public bool Equals(string[]? x, string[]? y)
        {
            if (x == null || y == null)
                return false;

            if (x.Length != y.Length)
                return false;

            for (int i = 0; i < x.Length; i++)
            {
                if (x[i] != y[i])
                    return false;
            }

            return true;
        }

        public int GetHashCode(string[] obj)
        {
            unchecked
            {
                int hash = 17;
                foreach (string s in obj)
                {
                    hash = hash * 23 + s.GetHashCode();
                }
                return hash;
            }
        }
    }
}