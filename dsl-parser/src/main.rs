#[macro_use]
mod marcos;

mod types;

use rust_json::ToJson;
use types::Table;

use std::{
    fs::{canonicalize, write},
    path::Path,
};

fn main() {
    let inpath = canonicalize(
        Path::new(include_str!("../config/in.txt"))
            .strip_prefix("../")
            .unwrap(),
    )
    .unwrap();
    
    println!(
        "Parsing, input: {}",
        inpath.display()
    );
    let t = include!(include_str!("../config/in.txt"));
    write(
        include_str!("../config/out.txt"),
        format!("{:#}", t.to_json()),
    )
    .unwrap();
    
    let outpath = canonicalize(include_str!("../config/out.txt")).unwrap();
    println!(
        "Parsing, output: {}",
        outpath.display()
    );
}
