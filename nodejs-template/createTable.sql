CREATE TABLE "Permission" (
    "Level" INTEGER NOT NULL,
    "Id" INTEGER NOT NULL UNIQUE,
    "User.Id" INTEGER NOT NULL,
    PRIMARY KEY("Id" AUTOINCREMENT),
    FOREIGN KEY("User.Id") REFERENCES "User"("Id")
);

CREATE TABLE "User" (
    "UserName" TEXT NOT NULL UNIQUE,
    "PassWord" TEXT NOT NULL,
    "Age" INTEGER NOT NULL,
    "Id" INTEGER NOT NULL UNIQUE,
    PRIMARY KEY("Id" AUTOINCREMENT)
);

CREATE TABLE "Token" (
    "Token" TEXT NOT NULL UNIQUE,
    "Id" INTEGER NOT NULL UNIQUE,
    "ForUser.Id" INTEGER NOT NULL,
    PRIMARY KEY("Id" AUTOINCREMENT),
    FOREIGN KEY("ForUser.Id") REFERENCES "User"("Id")
);

CREATE TABLE "Goods" (
    "Name" TEXT NOT NULL,
    "Price" INTEGER NOT NULL,
    "Stock" INTEGER NOT NULL,
    "Description" TEXT NOT NULL,
    "Id" INTEGER NOT NULL UNIQUE,
    "Owner.Id" INTEGER NOT NULL,
    PRIMARY KEY("Id" AUTOINCREMENT),
    FOREIGN KEY("Owner.Id") REFERENCES "User"("Id")
);

CREATE TABLE "OrderItem" (
    "Count" INTEGER NOT NULL,
    "Id" INTEGER NOT NULL UNIQUE,
    "Goods.Id" INTEGER NOT NULL,
    PRIMARY KEY("Id" AUTOINCREMENT),
    FOREIGN KEY("Goods.Id") REFERENCES "Goods"("Id")
);

CREATE TABLE "Order" (
    "TotalPrice" INTEGER NOT NULL,
    "Id" INTEGER NOT NULL UNIQUE,
    "Buyer.Id" INTEGER NOT NULL,
    PRIMARY KEY("Id" AUTOINCREMENT),
    FOREIGN KEY("Buyer.Id") REFERENCES "User"("Id")
);

CREATE TABLE "Order-Items-OrderItem" (
    "L.Order.Id" INTEGER NOT NULL,
    "R.OrderItem.Id" INTEGER NOT NULL,
    "Id" INTEGER NOT NULL UNIQUE,
    PRIMARY KEY("Id" AUTOINCREMENT),
    FOREIGN KEY("L.Order.Id") REFERENCES "Order"("Id"),
    FOREIGN KEY("R.OrderItem.Id") REFERENCES "OrderItem"("Id")
);

