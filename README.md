## 运行步骤

1. 源文件 `processing-data/input.ecg` 使用 `code-preprocess/` 下的 `npm run run` 得到 `processing-data/processed.ecg1`
2. `processing-data/processed.ecg1` 使用 `dsl-parser/` 下的 `cargo run` 得到 `processing-data/parsed.ecg2`
3. `processing-data/parsed.ecg2` 使用 `codegen/CodeGen` 下的 `dotnet run` 处理 