////// TODO
// PERSISTENCE CONNECTION
// REMPLASSER COULEUR PAR AVATAR
// PAGES
// MODIF LA GESTION DES ERREURS
// FUNCTION FS READ
// TRANSFORMER CODE EN MODULE
// AJOUTER UN BOUTON DE DECONNEXION
// GESTION DU DISCONNECT
// SELECTION AVATAR
// GIT + DEPLACER DOSSIER ECHANGE
// GESTION DES HIGHTSCORE
// ACCOUNT CLIENT
// APPROFONDIR LA PRESENCE DE JQUERY
// OBJET CONSTRUCTEUR JOUEUR
// OBJET CONSCTRUCTEUR PARTIE
// MULTIPARTIE SAME TIME
// ANIMATIONSSSS
// GESTION DE TAILLE AFFICHAGE
// DECIDER DU NOMBRE DE CARRE




//////////////////// REQUIRE / SERVEUR
const mongo = require('mongodb').MongoClient
const express = require('express')
const path = require('path')
const fs = require('fs')
const SocketIO = require('socket.io')
const PORT = process.env.PORT || 5000

//////////////////// CONNEXION SERVEUR
const app = express()
const server = require('http').Server(app)
const io = new SocketIO(server)
// valeur en dev
server.listen(PORT, () => console.log(`Listening on ${ PORT}`))
//valeur en deploy
// server.listen(process.env.PORT)


  // .use(express.static(path.join(__dirname, 'public')))
  // .get('/', (req, res) => res.render('pages/index'))
  // .listen(PORT, () => console.log(`Listening on ${ PORT }`))

//////////////////// USE / SET
app.use('/html', express.static(path.join(__dirname + '/public/html/')))
app.use('/css', express.static(path.join(__dirname + '/public/css/')))
app.use('/js', express.static(path.join(__dirname + '/public/js/')))
app.use('/lib', express.static(path.join(__dirname + '/node_modules/jquery/dist/')))
app.use('/lib', express.static(path.join(__dirname + '/node_modules/socket.io-client/dist/')))
app.use('/lib', express.static(path.join(__dirname + '/node_modules/jquery-validation/dist/')))

const element = {
    urlUser: "mongodb://heroku_rgz600fc:ttq2i95ffer6i8aj4958tcgkut@ds141902.mlab.com:41902/heroku_rgz600fc",
    dbName: "heroku_rgz600fc"
}

let joueur1 = {
    color: "blue"
}

let joueur2 = {
    color: "red"
}

let partie = {
}

app.get('/', function (req, res, next) {
    res.sendFile('./public/html/paper.html', {
        root: './'
    })
})


io.sockets.on('connect', function (socket) {
    socket.emit('id', socket.id)
    console.log('salut je suis ici')

    connectOrNotConnect = function (chemin, userIdClient) {
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            const collectionUser = client.db("heroku_rgz600fc").collection('user')
            if (err) {  
                console.log('xxxx - erreur mongo connexion au connectOrNotConnect = ', err)
            } else {
                collectionUser.findOne({
                    userId: userIdClient
                }, function (err, exist) {
                    if (err) {
                        console.log('xxxx - erreur mongo recherche au connectOrNotConnect = ', err)
                    } else if (exist) {
                        if (exist.connect) {
                            fs.readFile((chemin), function (err, filedata) {
                                if (err) {
                                    console.log('xxxx - erreur readFile au connectOrNotConnect exist = ', err)
                                } else {
                                    io.to(userIdClient).emit('recoi', filedata.toString())
                                }
                            })
                        }
                    } else {
                        fs.readFile(('./public/html/connect.html'), function (err, filedata) {
                            if (err) {
                                console.log('xxxx - erreur readFile sur connect n\'existe pas = ', err)
                            } else {
                                io.to(userIdClient).emit('recoi', filedata.toString())
                            }
                        })
                    }
                })
            }
        })
    }

    connectOrNotConnect('./public/html/myAccount.html', socket.id)

    socket.on('account', function (userId) {
        connectOrNotConnect('./public/html/myAccount.html', userId)
    })

    socket.on('rules', function () {
        fs.readFile(('./public/html/rules.html'), function (err, filedata) {
            if (err) {
                console.log('err read ', err)
            } else {
                socket.emit('recoi', filedata.toString())
            }
        })
    })

    socket.on('play', function (userId) {
        connectOrNotConnect('./public/html/wantPlay.html', userId)
    })

    socket.on('hightscore', function () {
        fs.readFile(('./public/html/hightscore.html'), function (err, filedata) {
            if (err) {
                console.log('err read ', err)
            } else {
                socket.emit('recoi', filedata.toString())
            }
        })
    })

    socket.on('about', function () {
        fs.readFile(('./public/html/about.html'), function (err, filedata) {
            if (err) {
                console.log('err read ', err)
            } else {
                socket.emit('recoi', filedata.toString())
            }
        })
    })

    socket.on('toCreateAccount', function () {
        fs.readFile(('./public/html/createAccount.html'), function (err, filedata) {
            if (err) {
                console.log('err read ', err)
            } else {
                socket.emit('recoi', filedata.toString())
            }
        })
    })

    socket.on('inscription', function (data) {
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            const collectionUser = client.db("heroku_rgz600fc").collection('user')
            if (err) {
                console.log('xxxx - erreur mongo connexion au socketOn inscription = ', err)
            } else {
                collectionUser.findOne({
                    pseudo: data.pseudo
                }, function (err, exist) {
                    if (err) {
                        console.log('xxxx - erreur mongo recherche au socketOn inscription = ', err)
                    } else if (exist) {
                        socket.emit('retourInscription', {
                            success: false
                        })
                    } else if (!exist) {
                        collectionUser.insert({
                            prenom: data.prenom,
                            nom: data.nom,
                            pseudo: data.pseudo,
                            mail: data.mail,
                            mdp: data.mdp,
                            userId: data.userId,
                            connect: true
                        }, function (err, insertOk) {
                            if (err) {
                                console.log('xxxx - erreur mongo insertion au socketOn inscription = ', err)
                            } else {
                                fs.readFile(('./public/html/myAccount.html'), function (err, filedata) {
                                    if (err) {
                                        console.log('xxxx - erreur read au socketOn inscription = ', err)
                                    } else {
                                        socket.emit('retourInscription', {
                                            filedata: filedata.toString(),
                                            success: true
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    socket.on('submitConnect', function (data) {
        console.log('++ On submitConnect = ', data)
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            if (err) {
                console.log('xxxx - erreur mongo connexion au socketOn submitConnect = ', err)
            } else {
                const collectionUser = client.db("heroku_rgz600fc").collection('user')
                collectionUser.findOne({
                    $and: [{
                        pseudo: data.pseudo
                    }, {
                        mdp: data.mdp
                    }]
                }, function (err, exist) {
                    if (err) {
                        console.log('xxxx - erreur mongo recherche au socketOn submitConnect = ', err)
                    } else if (exist) {
                        collectionUser.update({
                            _id: exist._id
                        }, {
                            $set: {
                                userId: data.userId,
                                connect: true
                            }
                        })
                        fs.readFile(('./public/html/myAccount.html'), function (err, filedata) {
                            if (err) {
                                console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                            } else {
                                let message = true
                                socket.emit('retourConnect', {
                                    filedata: filedata.toString(),
                                    message
                                })
                            }
                        })
                    } else {
                        fs.readFile(('./public/html/connect.html'), function (err, filedata) {
                            if (err) {
                                console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                            } else {
                                socket.emit('recoi', filedata.toString())
                            }
                        })
                    }
                })
            }
        })
    })

    socket.on('wantPlay', function () {
        console.log('socket', socket.id)
        io.of('/').adapter.clients(["gameRoom"], function (err, clients) {
            ////// ROUTE JOUEUR 2 + DEMARRAGE DU GAME
            if (clients.length == 1) {
                socket.join("gameRoom")
                mongo.connect(element.urlUser, {
                    useNewUrlParser: true
                }, function (err, client) {
                    const collectionUser = client.db("heroku_rgz600fc").collection('user')
                    if (err) {
                        console.log('xxxx - erreur mongo connexion au joueur 1wantPlay = ', err)
                    } else {
                        collectionUser.findOne({
                                userId: socket.id
                        }, function (err, exist) {
                            if (err) {
                                console.log('xxxx - erreur mongo recherche au joueur 1wantPlay = ', err)
                            } else if (exist) {
                                joueur2.pseudo = exist.pseudo
                                joueur2.score = 0
                                console.log(joueur2)
                                fs.readFile(('./public/html/game.html'), function (err, filedata) {
                                    if (err) {
                                        console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                                    } else {
                                        io.to("gameRoom").emit('demarrageGame', {filedata: filedata.toString(), joueur1: joueur1, joueur2: joueur2})
                                    }
                                })
                            } else {
                                fs.readFile(('./public/html/connect.html'), function (err, filedata) {
                                    if (err) {
                                        console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                                    } else {
                                        socket.emit('recoi', filedata.toString())
                                    }
                                })
                            }
                        })
                    }
                })
            ////// ROUTE JOUEUR 1
            } else if (clients.length == 0) {
                socket.join("gameRoom")
                //////////////////////////////////////
                mongo.connect(element.urlUser, {
                    useNewUrlParser: true
                }, function (err, client) {
                    const collectionUser = client.db("heroku_rgz600fc").collection('user')
                    if (err) {
                        console.log('xxxx - erreur mongo connexion au joueur 1wantPlay = ', err)
                    } else {
                        collectionUser.findOne({
                                userId: socket.id
                        }, function (err, exist) {
                            if (err) {
                                console.log('xxxx - erreur mongo recherche au joueur 1wantPlay = ', err)
                            } else if (exist) {
                                joueur1.pseudo = exist.pseudo
                                joueur1.score = 0
                                console.log(joueur1)
                                fs.readFile(('./public/html/waitingForPlaying.html'), function (err, filedata) {
                                    if (err) {
                                        console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                                    } else {
                                        socket.emit('recoi', filedata.toString())
                                    }
                                })
                            } else {
                                fs.readFile(('./public/html/connect.html'), function (err, filedata) {
                                    if (err) {
                                        console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                                    } else {
                                        socket.emit('recoi', filedata.toString())
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                fs.readFile(('./public/html/tooMuchUser.html'), function (err, filedata) {
                    if (err) {
                        console.log('xxxx - erreur read au socketOn submitConnect = ', err)
                    } else {
                        socket.emit('recoi', filedata.toString())
                    }
                })
            }
        })
    })

    socket.on('disconnect', function () {
        console.log('Got disconnect!')
        console.log(socket.id)
    })

})