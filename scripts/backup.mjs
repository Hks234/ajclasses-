import fs from "fs";
import path from "path";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(process.cwd(), "backups", stamp);
fs.mkdirSync(dest, { recursive: true });

const dbPath = path.join(process.cwd(), "data", "ajclasses.sqlite");
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, path.join(dest, "ajclasses.sqlite"));
}

const secret = path.join(process.cwd(), "data", "auth-secret");
if (fs.existsSync(secret)) fs.copyFileSync(secret, path.join(dest, "auth-secret"));

const integrations = path.join(process.cwd(), "storage", "private", "integrations.json");
if (fs.existsSync(integrations)) {
  fs.mkdirSync(path.join(dest, "private"), { recursive: true });
  fs.copyFileSync(integrations, path.join(dest, "private", "integrations.json"));
}

const note = [
  "AJ Classes backup",
  stamp,
  "",
  "This copy includes the local SQLite database and local secrets if they exist.",
  "Copy the storage directory separately. It can be very large because it holds course videos.",
  "Example: copy the storage folder to backups/" + stamp + "/storage",
  "For TiDB or MySQL, export with mysqldump or the TiDB console as well.",
  "Nothing is deleted by this script.",
].join("\n");
fs.writeFileSync(path.join(dest, "README.txt"), note);
console.log("Backup created at " + dest);
