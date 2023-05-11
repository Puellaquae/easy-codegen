using CodeGen;
using System.Text.Json;

namespace TestProject
{
    [TestClass]
    public class ParsedDataLoad
    {

        [TestMethod]
        public void RawFieldTest()
        {
            (string, string)[] tests = {
                ("{\"is_array\":false,\"type\":\"Int\",\"str_enum\":null,\"int_range_start\":null,\"is_unique\":true,\"int_range_end\":null,\"name\":\"A\",\"is_nullable\":false}", "A:@Int"),
                ("{\"type\":\"Int\",\"is_nullable\":true,\"int_range_start\":null,\"name\":\"A\",\"int_range_end\":null,\"str_enum\":null,\"is_array\":false,\"is_unique\":false}", "A:?Int"),
                ("{\"type\":\"Int\",\"is_nullable\":false,\"int_range_start\":null,\"int_range_end\":null,\"name\":\"A\",\"is_unique\":false,\"is_array\":true,\"str_enum\":null}", "A:[]Int"),
                ("{\"is_array\":false,\"is_nullable\":false,\"is_unique\":false,\"int_range_start\":0,\"int_range_end\":2,\"type\":\"Int\",\"name\":\"A\",\"str_enum\":null}", "A:Int{0..2}"),
                ("{\"is_array\":false,\"name\":\"A\",\"is_nullable\":false,\"str_enum\":null,\"int_range_start\":null,\"int_range_end\":2,\"is_unique\":false,\"type\":\"Int\"}", "A:Int{..2}"),
                ("{\"is_unique\":false,\"is_array\":false,\"is_nullable\":false,\"type\":\"Int\",\"name\":\"A\",\"int_range_end\":null,\"int_range_start\":0,\"str_enum\":null}", "A:Int{0..}"),
                ("{\"type\":\"Int\",\"is_unique\":false,\"int_range_end\":2,\"is_array\":false,\"int_range_start\":0,\"str_enum\":null,\"name\":\"A\",\"is_nullable\":false}", "A:Int{0..2}"),
                ("{\"str_enum\":[\"A\",\"B\"],\"type\":\"String\",\"int_range_start\":null,\"is_array\":false,\"int_range_end\":null,\"name\":\"A\",\"is_unique\":false,\"is_nullable\":false}", "A:String{\"A\",\"B\"}"),
                ("{\"name\":\"A\",\"is_unique\":true,\"is_nullable\":false,\"str_enum\":null,\"int_range_end\":2,\"type\":\"Int\",\"int_range_start\":0,\"is_array\":false}", "A:@Int{0..2}"),
                ("{\"int_range_start\":null,\"str_enum\":null,\"name\":\"A\",\"is_unique\":true,\"type\":\"Int\",\"is_array\":false,\"is_nullable\":false,\"int_range_end\":2}", "A:@Int{..2}"),
                ("{\"name\":\"A\",\"is_array\":false,\"int_range_end\":null,\"is_unique\":false,\"int_range_start\":0,\"is_nullable\":true,\"type\":\"Int\",\"str_enum\":null}", "A:?Int{0..}"),
                ("{\"is_unique\":false,\"int_range_end\":2,\"name\":\"A\",\"is_nullable\":true,\"is_array\":false,\"int_range_start\":0,\"str_enum\":null,\"type\":\"Int\"}", "A:?Int{0..2}"),
                ("{\"is_nullable\":false,\"type\":\"String\",\"int_range_start\":null,\"is_array\":true,\"name\":\"A\",\"is_unique\":true,\"int_range_end\":null,\"str_enum\":[\"A\",\"B\"]}", "A:[]@String{\"A\",\"B\"}")
            };

            JsonSerializerOptions options = new JsonSerializerOptions()
            {
                PropertyNameCaseInsensitive = true
            };

            foreach (var (test, res) in tests)
            {
                RawField? rawField = JsonSerializer.Deserialize<RawField>(test, options);
                Assert.IsNotNull(rawField);
                Assert.AreEqual(res, rawField.ToString());
            }
        }
    }
}