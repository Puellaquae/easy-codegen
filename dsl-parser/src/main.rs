#[macro_use]
mod marcos;

mod types;

use rust_json::ToJson;
use types::Table;

use std::fs::write;

fn main() {
    let t = include!("../../processing-data/processed.ecg1");
    write(
        "../processing-data/parsed.ecg2",
        format!("{:#}", t.to_json()),
    )
    .unwrap();
}
