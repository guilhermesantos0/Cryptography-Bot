const Discord = require("discord.js");
require("dotenv").config();
const crypto = require("./crypto");
const config = require("./config.json");

const colors = require("colors");
const process = require("process");

const client = new Discord.Client({ 
    intents: [
        Discord.GatewayIntentBits.Guilds, 
        Discord.GatewayIntentBits.GuildMembers, 
        Discord.GatewayIntentBits.DirectMessages, 
        Discord.GatewayIntentBits.GuildMessages, 
        Discord.GatewayIntentBits.MessageContent
    ], 
    partials: [
        Discord.Partials.Channel,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.User
    ]
});

const commands = [
    {
        name: 'createkey',
        description: 'Cria e adiciona uma nova chave na lista!',
        type: Discord.ApplicationCommandType.ChatInput,
        run: async(interaction, args) => {

            crypto.generateKey();

            const embed = new Discord.EmbedBuilder()
            .setTitle("Chave criada!")
            .setDescription(`Uma chave foi criada! Total de chaves: ${Discord.inlineCode(crypto.getKeysAmount())}`)
            .setColor(config.color)

            interaction.reply({ embeds: [embed] })

        }
    },
    {
        name: 'encrypt',
        description: 'Criptografa um texto e manda o texto criptografado!',
        type: Discord.ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'texto',
                description: 'Texto a ser criptografado!',
                type: Discord.ApplicationCommandOptionType.String,
                required: true
            }
        ],
        run: async(interaction, args) => {

            const msg = await crypto.encryptText(args.texto)

            const embed = new Discord.EmbedBuilder()
            .setTitle("Texto Criptografado!")
            .setDescription(Discord.codeBlock(msg))
            .setColor(config.color)

            interaction.reply({ embeds: [embed], ephemeral: true })

        }
    },
    {
        name: 'decrypt',
        description: 'Descriptografa um texto criptografado com esta criptografia!',
        type: Discord.ApplicationCommandType.ChatInput,
        options: [
            {
                name: 'texto',
                description: 'Texto a ser descriptografado!',
                type: Discord.ApplicationCommandOptionType.String,
                required: true
            }
        ],
        run: async(interaction, args) => {

            const msg = await crypto.decryptText(args.texto)

            const embed = new Discord.EmbedBuilder()
            .setTitle("Texto Descriptografado!")
            .setDescription(Discord.codeBlock(msg))
            .setColor(config.color)

            interaction.reply({ embeds: [embed], ephemeral: true })

        }
    },
    {
        name: 'backup',
        description: 'Manda um backup da pasta keys.json!',
        type: Discord.ApplicationCommandType.ChatInput,
        run: async(interaction, args) => {

            const file = "./keys.json"

            const embed = new Discord.EmbedBuilder()
            .setTitle("Backup das Chaves!")
            .setDescription("Aqui está um backup da pasta `keys.json`! Guarde em um lugar seguro!")
            .setColor(config.color)

            interaction.reply({ embeds: [embed], files: [file], ephemeral: true })

        }
    }
]

client.on('interactionCreate', async(interaction) => {

    const cmd = commands.find(i => i.name == interaction.commandName);
        
    if (!cmd) return;

    const args = {};

    for (let option of interaction.options.data) {
        if (option.value) args[option.name] = option.value; 
    }

    cmd.run(interaction, args);
})

client.on('ready', async ()  => {

    await client.application.commands.set(commands)
    console.log(`${client.user.username} online!`)

    let i = 0;
    setInterval(() => {

        client.user.setActivity(config.activities[i].name, config.activities[i].options)
        i == config.activities.length - 1 ? i = 0 : i++

    },5000)

    setInterval(() => {
        const ramUsage = process.memoryUsage().rss / 1000000
        console.log(`${ramUsage > 70 ? `${colors.red(ramUsage)}MB` : `${colors.green(ramUsage)}MB`}`)
    }, 10)
})

client.on('messageCreate', async(message) => {

    if(message.content == `<@${client.user.id}>` || message.content == `<@!${client.user.id}>`){

        const embed = new Discord.EmbedBuilder()
        .setTitle("Escolha uma opção!")
        .setDescription("> Criptografar\nCriptografará um texto para você!\n\n> Descriptografar\nDescriptografará um texto para você!\n\n> Criar Chave\nCria uma chave de criptografia nova!")
        .setColor(config.color)
        .setThumbnail(client.user.avatarURL())
        .setFooter({ text: "Desenvolvido por GuilhermeSantos#0001", iconURL: client.user.avatarURL() })

        const selectMenu = new Discord.StringSelectMenuBuilder()
        .setCustomId("option")
        .setPlaceholder("Escolha uma opção!")
        .setOptions([
            {
                label: 'Criptografar',
                value: 'encrypt'
            },
            {
                label: 'Descriptografar',
                value: 'decrypt'
            },
            {
                label: 'Criar Chave',
                value: 'generatekey'
            }
        ])

        const confirmButton = new Discord.ButtonBuilder()
        .setCustomId('confirm')
        .setLabel("CONFIRMAR")
        .setStyle(Discord.ButtonStyle.Success)

        const cancelButton = new Discord.ButtonBuilder()
        .setCustomId('cancel')
        .setLabel("CANCELAR")
        .setStyle(Discord.ButtonStyle.Danger)

        const row = new Discord.ActionRowBuilder()
        .setComponents(selectMenu)

        const buttonRow = new Discord.ActionRowBuilder()
        .setComponents(confirmButton, cancelButton)

        message.reply({ embeds: [embed], components: [row,buttonRow], ephemeral: true }).then(msg => {

            message.delete().catch(err => {})

            let option;

            let collector = msg.createMessageComponentCollector({ time: 60000 })
            collector.on('collect', c => {

                c.deferUpdate()

                if(c.isStringSelectMenu()){

                    if(c.customId == "option"){

                        option = c.values[0]
                    }
                }

                if(c.isButton()){

                    if(c.customId == "confirm"){

                        if(option == "encrypt"){

                            const nEmbed = new Discord.EmbedBuilder()
                            .setTitle("Criptografar Texto!")
                            .setDescription("Envie aqui a mensagem que você deseja criptografar! \n*Esta mensagem será confidencial!*")
                            .setColor(config.color)
                            .setThumbnail(client.user.avatarURL())
                            .setFooter({ text: "Desenvolvido por GuilhermeSantos#0001", iconURL: client.user.avatarURL() })

                            msg.edit({ embeds: [nEmbed], components: [], ephemeral: true }).then(msg => {

                                collector = msg.channel.createMessageCollector({ max: 1, filter: m => m.author.id == message.author.id, time: 60000 })
                                collector.on('collect', async c => {

                                    c.delete().catch(err => {})

                                    let encryptMsg = await crypto.encryptText(c.content)

                                    const fEmbed = new Discord.EmbedBuilder()
                                    .setTitle("Texto Criptografado!")
                                    .setDescription(Discord.codeBlock(encryptMsg))
                                    .setColor(config.color)

                                    const sEmbed = new Discord.EmbedBuilder()
                                    .setTitle("Texto criptografado com sucesso!")
                                    .setDescription("O texto foi enviado no seu PV, caso esteja bloqueado, desbloqueie e clique no botão abaixo!")
                                    .setColor(config.color)

                                    const resendButton = new Discord.ButtonBuilder()
                                    .setCustomId("resend")
                                    .setLabel("ENVIAR NOVAMENTE")
                                    .setStyle(Discord.ButtonStyle.Primary)

                                    const row = new Discord.ActionRowBuilder()
                                    .setComponents(resendButton)

                                    message.author.send({ embeds: [fEmbed] }).catch(err => {})

                                    msg.edit({ embeds: [sEmbed], components: [row] }).then(msg => {

                                        let _collector = msg.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 60000 })

                                        _collector.on('collect', c => {

                                            if(c.user.id == message.author.id ){

                                                message.author.send({ embeds: [fEmbed] })
                                                .catch(err => {
                                                    msg.reply('O seu PV está bloquado. Desbloqueie e clique novamente no botão!').then(tmsg => {
                                                        setTimeout(() => {

                                                            tmsg.delete().catch(err => {})

                                                        },5000)
                                                    }).catch(err => {})
                                                })
                                            }
                                        })
                                    }).then(msg => {

                                        setTimeout(() => {

                                            msg.delete().catch(err => {})

                                        },60000)
                                    })
                                })
                            })
                        }else if(option == "decrypt"){

                            const nEmbed = new Discord.EmbedBuilder()
                            .setTitle("Descriptografar Texto!")
                            .setDescription("Envie aqui a mensagem que você deseja descriptografar! \n*Este sistema funciona apenas para mensagens criptografadas por este bot!*")
                            .setColor(config.color)
                            .setThumbnail(client.user.avatarURL())
                            .setFooter({ text: "Desenvolvido por GuilhermeSantos#0001", iconURL: client.user.avatarURL() })

                            msg.edit({ embeds: [nEmbed], components: [], ephemeral: true }).then(msg => {

                                collector = msg.channel.createMessageCollector({ max: 1, filter: m => m.author.id == message.author.id, time: 60000 })
                                collector.on('collect', async c => {

                                    c.delete().catch(err => {})

                                    let decryptMsg = await crypto.decryptText(c.content)

                                    const fEmbed = new Discord.EmbedBuilder()
                                    .setTitle("Texto Descriptografado!")
                                    .setDescription(Discord.codeBlock(decryptMsg))
                                    .setColor(config.color)

                                    const sEmbed = new Discord.EmbedBuilder()
                                    .setTitle("Texto descriptografado com sucesso!")
                                    .setDescription("O texto foi enviado no seu PV, caso esteja bloqueado, desbloqueie e clique no botão abaixo!")
                                    .setColor(config.color)

                                    const resendButton = new Discord.ButtonBuilder()
                                    .setCustomId("resend")
                                    .setLabel("ENVIAR NOVAMENTE")
                                    .setStyle(Discord.ButtonStyle.Primary)

                                    const row = new Discord.ActionRowBuilder()
                                    .setComponents(resendButton)

                                    message.author.send({ embeds: [fEmbed] }).catch(err => {})

                                    msg.edit({ embeds: [sEmbed], components: [row] }).then(msg => {

                                        let _collector = msg.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 60000 })

                                        _collector.on('collect', c => {

                                            if(c.user.id == message.author.id ){

                                                message.author.send({ embeds: [fEmbed] })
                                                .catch(err => {
                                                    msg.reply('O seu PV está bloquado. Desbloqueie e clique novamente no botão!').then(tmsg => {
                                                        setTimeout(() => {

                                                            tmsg.delete().catch(err => {})
                                                        },5000)
                                                    }).catch(err => {})
                                                })
                                            }
                                        })
                                    }).then(msg => {

                                        setTimeout(() => {

                                            msg?.delete().catch(err => {})

                                        },60000)
                                    })
                                })
                            })
                        }else if(option == "generatekey"){

                            crypto.generateKey();

                            const embed = new Discord.EmbedBuilder()
                            .setTitle("Chave criada!")
                            .setDescription(`Uma chave foi criada! Total de chaves: ${Discord.inlineCode(crypto.getKeysAmount())}`)
                            .setColor(config.color)

                            message.reply({ embeds: [embed] })
                        }
                    }
                }
            })
        })
    }
})

client.login(process.env.TOKEN)