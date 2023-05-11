macro_rules! typeRange {
    ($field:ident { $s:tt ..=  }) => {
        $field.int_range_start = Some($s);
    };
    ($field:ident { $s:tt ..  }) => {
        $field.int_range_start = Some($s);
    };
    ($field:ident { ..= $e:expr }) => {
        $field.int_range_end = Some($e + 1);
    };
    ($field:ident { .. $e:expr }) => {
        $field.int_range_end = Some($e);
    };
    ($field:ident { $s:tt ..= $e:expr }) => {
        $field.int_range_start = Some($s);
        $field.int_range_end = Some($e + 1);
    };
    ($field:ident { $s:tt .. $e:expr }) => {
        $field.int_range_start = Some($s);
        $field.int_range_end = Some($e);
    };
    ($field:ident { $($s:expr),* }) => {
        $field.str_enum = Some(vec![$(stringify!($s)),*]
            .into_iter()
            .filter_map(|f| f.strip_prefix("\"").and_then(|s| s.strip_suffix("\"")))
            .map(|s| s.to_string())
            .collect()
        );
    };
    ($field:ident ) => {

    };
}

macro_rules! ttype {
    ($field:ident $t:ident $($rest:tt)*) => {
        $field.ty = stringify!($t).to_string();
        typeRange!($field $($rest)*);
    };

    ($field:ident @ $t:ident $($rest:tt)*) => {
        $field.ty = stringify!($t).to_string();
        $field.is_unique = true;
        typeRange!($field $($rest)*);
    };

    ($field:ident ? $t:ident $($rest:tt)*) => {
        $field.ty = stringify!($t).to_string();
        $field.is_nullable = true;
        typeRange!($field $($rest)*);
    };
}

macro_rules! field {
    ($name:ident : [ $($t:tt)* ] ) => {{
        let mut field = crate::types::Field::default();
        field.name = stringify!($name).to_string();
        field.is_array = true;
        ttype!(field $($t)*);
        field
    }};

    ($name:ident : $($t:tt)* ) => {{
        let mut field = crate::types::Field::default();
        field.name = stringify!($name).to_string();
        ttype!(field $($t)*);
        field
    }};
}

macro_rules! table {
    (entity $name:ident { $($t:tt)* }) => {{
        Table{
            name: stringify!($name).to_string(),
            fields: vec![$($t)*]
        }
    }};
}
