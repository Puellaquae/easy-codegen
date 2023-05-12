using LogicGen;

namespace LogicGen
{
    public class Tree
    {

    }

    public class FnContext
    {
        public FnContext() { }

        public void Begin(string name)
        {

        }

        public void End()
        {

        }

        public Tree Input(Tree tree)
        {

        }
    }

    public class Table
    {
        public static Tree Id;
    }
}

internal class Program
{
    private static void Main(string[] args)
    {
        FnContext fnCtx = new();

        {
            fnCtx.Begin("TableOrderAppend");
            var TId = fnCtx.Input(Table.Id);
            var FId = fnCtx.Input(Food.Id);
            var Count = fnCtx.Input(Int);

            var CurOrderItems = TId.Table.CurOrder.Items;
            var TheOrderItem = CurOrderItems.First(ctx => ctx.OrderItem.Food.Id == FId);
            Branch(
                TheOrderItem,
                () => { TheOrderItem.Count = TheOrderItem.Count + Count; },
                () => { CurOrderItems.Append(OrderItem(FId.Food, Count)); }
            );

            fnCtx.End();
        }

        Console.WriteLine("Hello, World!");
    }
}