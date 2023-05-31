#![allow(unused_macros)]
#![allow(unused_mut)]

#[macro_use]
mod marcos;

mod types;

use rust_json::ToJson;
use types::Table;

use std::{
    fs::{canonicalize, write},
    path::Path,
};

use crate::types::Ecg;

fn main() {
    let inpath = canonicalize(
        Path::new(include_str!("../config/in.txt"))
            .strip_prefix("../")
            .unwrap(),
    )
    .unwrap();

    println!("Parsing, input: {}", inpath.display());
    let ens = include!(include_str!("../config/in.txt"));
    write(
        include_str!("../config/out.txt"),
        format!("{:#}", ens.to_json()),
    )
    .unwrap();

    let outpath = canonicalize(include_str!("../config/out.txt")).unwrap();
    println!("Parsing, output: {}", outpath.display());
}
