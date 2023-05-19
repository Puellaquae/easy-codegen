namespace SExpr
{
    public class FnSignEqualityComparer : IEqualityComparer<(string, string[])>
    {
        public bool Equals((string, string[]) x, (string, string[]) y)
        {
            if (x.Item1 != y.Item1)
            {
                return false;
            }

            if (x.Item2.Length != y.Item2.Length)
            {
                return false;
            }

            for (int i = 0; i < x.Item2.Length; i++)
            {
                if (x.Item2[i] != y.Item2[i])
                {
                    return false;
                }
            }

            return true;
        }

        public int GetHashCode((string, string[]) obj)
        {
            unchecked
            {
                int hash = 17;
                hash = hash * 23 + obj.Item1.GetHashCode();
                foreach (string s in obj.Item2)
                {
                    hash = hash * 23 + s.GetHashCode();
                }
                return hash;
            }
        }
    }
}