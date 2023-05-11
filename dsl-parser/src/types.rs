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
    pub fields: Vec<Field>
}