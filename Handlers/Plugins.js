const { Perms } = require("../Validation/Permissions");
const { Events } = require("../Validation/EventNames");
const { Client } = require("discord.js")

const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const Ascii = require("ascii-table");


/**
 * @param {Client} client
 */

module.exports = async (client) => {
  // Event Handler
  const Table = new Ascii("Plugin Events Loaded");

  (await PG(`${process.cwd()}/Plugins/*/Events/*.js`)).map(async (file) => {
    const event = require(file);

    if(!Events.includes(event.name) || !event.name) {
      const L = file.split("/");
      await Table.addRow(`${event.name || "MISSING"}`, `❌ Event name is either invalid or missing: ${L[6] + `/` + L[7]}`);
      return;
    }

    if(event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else{
      client.on(event.name, (...args) => event.execute(...args, client));
    };

    await Table.addRow(event.name, "✔ Successful");
  });

  console.log(Table.toString());


  // Command Handler
  const Table1 = new Ascii("Plugin Command Loaded")

  CommandsArray = [];

  (await PG(`${process.cwd()}/Plugins/*/Commands/*.js`)).map(async (file) => {
    const command = require(file);

    if(!command.name)
    return Table1.addRow(file.split("/")[7], "❌ FAILD", "Missing A Name")

    if(!command.description)
    return Table1.addRow(command.name, "❌ FAILD", "Missing A Description")

    if(!command.permission) {
      if(Perms.includes(command.permission))
      command.defaultPermission = false;
      else
      return Table1.addRow(command.name, "❌ FAILD", "Permission Is Invalid")
    }

    client.commands.set(command.name, command);
    CommandsArray.push(command);
    await Table1.addRow(command.name, "✔ Successful")

  });

   console.log(Table1.toString())

   // PERMISSIONS CHECK //

   client.on("ready", async () => {
     const MainGuild = await client.guilds.cache.get("941828150818635846");

     MainGuild.commands.set(CommandsArray).then(async (command) => {
       const Roles = (commandName) => {
         const cmdPerms = CommandsArray.find((c) => c.name === commandName).permission;
         if(!cmdPerms) return null;

         return MainGuild.roles.cache.filter((r) => r.permissions.has(cmdPerms));
       }

       const fullPermissions = command.reduce((accumulator, r) => {
         const roles = Roles(r.name);
         if(!roles) return accumulator;

         const permissions = roles.reduce((a, r) => {
           return [...a, {id: r.id, type: "ROLE", permission: true}]
         }, [])

         return [...accumulator, {id: r.id, permissions}]
       }, [])

       await MainGuild.commands.permissions.set({ fullPermissions });
     });
   });
};