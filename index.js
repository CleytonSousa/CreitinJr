const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const configs = require('./config.json');
const google = require('googleapis');

const youtube = new google.youtube_v3.Youtube({
    version: 'v3',
    auth: configs.GOOGLE_KEY
});

const prefixo = configs.PREFIX;

// ytdlOption = configs.YTDL;

const servidores = {
    'server':{
        connection: null,
        dispatcher:null,
        fila: [],
        estouTocando: false
    }
}

client.on("ready", ()=> {
    console.log('Estou online')
});

client.on("message", async (msg)=>{

    // Comandos com nome
    if(msg.content === prefixo + "creitin"){
        msg.channel.send('Qual foi '+ msg.author.username+" ? 🥸" )
    }


    //me
    if(msg.content === prefixo + "Cleyton sousa"){
        msg.channel.send('SIIIIIIIIIIIIIIIIIIIIIIIIIIIII')
        msg.channel.send('https://i.gifer.com/1k6o.gif')

    }

    // bugo :c
    if(msg.content === prefixo + "Deu bug"){
        msg.channel.send('Sinto muito 💔💔💔🫂')
        msg.channel.send('https://i.giphy.com/media/iJJ6E58EttmFqgLo96/giphy.webp')
    }


    //filtros
    if(!msg.guild) return;

    if(!msg.content.startsWith(prefixo)) return;

    if(!msg.member.voice.channel && msg.content === prefixo + 'tocar'){
msg.channel.send('Oxe, tu é besta é? pra tocar uma musica primeiro tu tem que entrar em um canal de voz tabacudo(a)');
        return;
} 
    
    //comandos
    if(msg.content === prefixo + 'entrar'){ // entrar no canal de voz
        try {
            servidores.server.connection = await msg.member.voice.channel.join();
        } catch(err) {
            console.log('Erro ao entrar no canal de voz!');
            console.log(err);
        }
    }

    if(msg.content === prefixo + 'sair'){ // sair do canal de voz
        msg.member.voice.channel.leave();
        servidores.server.connection = null;
        servidores.server.dispatcher = null;
        servidores.server.estouTocando = false;
        servidores.server.fila = [];
    }

    if(msg.content.startsWith(prefixo + 'tocar')){//comando pra tocar
        let tocar = msg.content.slice(7);

        if (tocar.length === 0) {
            msg.channel.send('Você precisa por o link pra que eu toque seu video/musica');
            return;
        }

        if (servidores.server.connection === null) {
            try {
                servidores.server.connection = await msg.member.voice.channel.join();
            } catch(err) {
                console.log('Erro ao entrar no canal de voz!');
                console.log(err);
            }
        }

        if(!msg.member.voice.channel){
            msg.channel.send('Voçê não esta em um canal de voz, como tu vai ouvir a musica?????')
            return;
        }else if(ytdl.validateURL(tocar)) {
            servidores.server.fila.push(tocar);
            console.log("adicionado: " + tocar);
            tocaMusica();
        } else {
            youtube.search.list({
                q: tocar,
                part: 'snippet',
                fields: 'items(id(videoId),snippet(title,channelTitle))',
                type: 'video'
            }, function(err, resultado) {
                if (err){
                    console.log(err);
                }
                if (resultado){

                    const listaResultados = [];
                    // organiza os resultados das pesquisas
                    for (let i in resultado.data.items) {
                        const montarItems = {
                            'tituloVideo': resultado.data.items[i].snippet.title,
                            'nomeCanal': resultado.data.items[i].snippet.channelTitle,
                            'id': 'https://www.youtube.com/watch?v=' + resultado.data.items[i].id.videoId
                        }
                        listaResultados.push(montarItems);
                    }

                    // controi a lista de musicas ao dar play sem link
                    const embed = new Discord.MessageEmbed()
                        .setColor([5,214,176])
                        .setAuthor('CreitinJr')
                        .setDescription('Escolha sua musica digitando o valor correspondente de 1 a 5!');
                    // adiciona campos pra cada resultado inclusive  numeros antes do titulo
                    for (let i in listaResultados) {
                        embed.addField(
                            `${parseInt(i) + 1}: ${listaResultados[i].tituloVideo}`,
                            listaResultados[i].nomeCanal
                        );
                    }
                    msg.channel.send(embed).then((embedMessage) =>{
                        const possiveisReacoes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

                        // reações com cada emoji
                        for (let i = 0; i < possiveisReacoes.length; i++){
                            embedMessage.react(possiveisReacoes[i]);
                        }

                        const filter = (reaction, user) => {
                            return possiveisReacoes.includes(reaction.emoji.name) && user.id === msg.author.id;
                        }

                        embedMessage.awaitReactions(filter, {max: 1, time: 20000, errors: ['times']})
                        .then((collected) => {
                            const reaction = collected.first();
                            const idOptionSelected = possiveisReacoes.indexOf(reaction.emoji.name);

                            msg.channel.send(`Você escolheu ${listaResultados[idOptionSelected].tituloVideo}
                             de ${listaResultados[idOptionSelected].nomeCanal}`);

                             servidores.server.fila.push(listaResultados[idOptionSelected].id);
                             tocaMusica();
                        })
                        .catch((error) => {
                            msg.reply('Você não escolheu uma opção valida, quer me tirar pra otário? :(');
                            console.log(error);
                        });
                    });
                }
            });
        }
    }

    //pular

    if(msg.content === prefixo + "pular"){
        msg.react('✅');
        servidores.server.dispatcher.end(tocaMusica);
        msg.channel.send('Musica pulada!');
    }

    //pausar
    if (msg.content === prefixo + 'pausar') {
        msg.react('✅')
        servidores.server.dispatcher.pause(true);
        msg.channel.send("Sua Musica foi Pausada!")
    }
    //resumir (bug aqui)(pelo visto o discord.js não funciona bem no node 14)
    if (msg.content === prefixo + 'resumir') {
        servidores.server.dispatcher.resume(true)
        servidores.server.dispatcher.pause(false)
        servidores.server.dispatcher.pause(false)
        servidores.server.dispatcher.resume(true)
        msg.react('🔁')
    }

});


    const tocaMusica = () => {
        if(servidores.server.estouTocando === false){
            const tocando = servidores.server.fila[0];
            servidores.server.estouTocando = true;
            servidores.server.dispatcher = servidores.server.connection.play(ytdl(tocando, configs.YTDL));

            servidores.server.dispatcher.on('finish', () => {
                servidores.server.fila.shift();

                servidores.server.estouTocando = false;
                if(servidores.server.fila.length > 0) {
                    tocaMusica();
                }
                else {
                    servidores.server.dispatcher = null;
                }
            });
        }
    }

client.login(configs.TOKEN_DISCORD);