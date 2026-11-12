import {readFile,writeFile} from "node:fs/promises";
const target=new URL("../modules/student.js",import.meta.url);
let source=await readFile(target,"utf8");
source=source.replace('const key=()=> "sajilo-gk:exam:"+(s.user?.uid||"guest");','const key=()=> "sajilo-gk:exam:"+(quiz?.owner||s.user?.uid||"guest");');
source=source.replace('quiz={id:id(),title:config.title,questions:','quiz={id:id(),owner:s.user?.uid||"guest",title:config.title,questions:');
source=source.replace('c.heading("A fresh day. A little more progress.",','c.heading(s.settings.welcome||"A fresh day. A little more progress.",');
await writeFile(target,source,"utf8");
