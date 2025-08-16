import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

console.log(process.env.author);
console.log("Hello World!");
