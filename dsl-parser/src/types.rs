use rust_json_derive::ToJson;

#[derive(Debug, Default, ToJson)]
pub struct Field {
    pub name: String,
    #[rename = "type"]
    pub ty: String,
    pub is_array: bool,
    pub is_unique: bool,
    pub is_nullable: bool,
    pub int_range_start: Option<i32>,
    pub int_range_end: Option<i32>,
    pub str_enum: Option<Vec<String>>,
}

#[derive(Debug, Default, ToJson)]
pub struct Table {
    pub name: String,
    pub fields: Vec<Field>,
}

#[derive(Debug, Default, ToJson)]
pub struct Arg {
    pub name: Option<String>,
    pub ty: String,
}

#[derive(Debug, Default, ToJson)]
pub struct Func {
    pub name: String,
    pub is_stub: bool,
    pub args: Vec<Arg>,
    pub ret_ty : Option<String>,
    pub exprs: Vec<String>,
}

#[derive(Debug, Default, ToJson)]

pub struct Route {
    pub path: String,
    pub method: String,
    pub fn_name: String,
    pub params: Vec<String>
}

#[derive(Debug, ToJson)]
pub struct Ecg {
    pub entities: Vec<Table>,
    pub fns: Vec<Func>,
    pub route: Vec<Route>
}
