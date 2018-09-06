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
///////////// GIT + DEPLACER DOSSIER ECHANGE
// GESTION DES HIGHTSCORE
// ACCOUNT CLIENT
// APPROFONDIR LA PRESENCE DE JQUERY
// OBJET CONSTRUCTEUR JOUEUR
// OBJET CONSCTRUCTEUR PARTIE
// MULTIPARTIE SAME TIME
// ANIMATIONSSSS
// GESTION DE TAILLE AFFICHAGE
// DECIDER DU NOMBRE DE CARRE
// RUPTURE DES Hx EN CSS + NETTOYER
// virer les fonctions anonyme
// solutionner le problème de ctx dans le fichier game (function pour emit )
// 2015 OU V5, il faut choirsir !
// quitter la partie
// désactiver le menu pendant la partie
// virer le titre Game
// placer les messages dans un objet
// objet constructeur joueur




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
server.listen(PORT, () => console.log(`Listening on ${ PORT}`))

//////////////////// USE / SET
app.use('/html', express.static(path.join(__dirname + '/public/html/')))
app.use('/css', express.static(path.join(__dirname + '/public/css/')))
app.use('/js', express.static(path.join(__dirname + '/public/js/')))
app.use('/lib', express.static(path.join(__dirname + '/node_modules/jquery/dist/')))
app.use('/lib', express.static(path.join(__dirname + '/node_modules/socket.io-client/dist/')))
app.use('/lib', express.static(path.join(__dirname + '/node_modules/jquery-validation/dist/')))

const element = {
    // urlUser: "mongodb://heroku_rgz600fc:ttq2i95ffer6i8aj4958tcgkut@ds141902.mlab.com:41902/heroku_rgz600fc",
    // dbName: "heroku_rgz600fc"
    dbName : "db",
    urlUser : "mongodb://localhost:27017/user"
}

let joueur1 = {
    color: "blue",
    victoire: false,
    pseudo: '',
    score: 0,
    socketId: ''
}

let joueur2 = {
    color: "red",
    victoire: false,
    pseudo: '',
    score: 0,
    socketId: ''
}

let elementJeu = {
    nbCarre: 8,
    tailleReference: 50,
    tabCarre: [],
    esquiveAngle: 5,
    tolerance: 3,
    valeurFinJeu: 33,
    finJeu: false
}

let actualTour = {
    stopEmit: false,
    scoreChange: false,
    socketId: '',
    compteurDetection:0
}


app.get('/', function (req, res, next) {
    res.sendFile('./public/html/paper.html', {
        root: './'
    })
})

function creationGrille() {
    for (var i = 0; i < elementJeu.nbCarre; i++) {
        for (var y = 0; y < elementJeu.nbCarre; y++) {
            var carre = new Carre(i, y);
            elementJeu.tabCarre.push(carre);
        }
    }
    return elementJeu.tabCarre
}

function Carre(x, y) {
    this.id = ""+x+y
    this.propertyOf = '';
    this.xMemoire = x;
    this.yMemoire = y;
    this.x = this.xMemoire * elementJeu.tailleReference;
    this.y = this.yMemoire * elementJeu.tailleReference;
    this.color = "#000000";
    this.colorBase = '#BDDAFF';
    this.colorUse = 'black';
    this.bordHaut = {
        use: true,
        color: this.colorBase,
        xDebut : this.x + elementJeu.esquiveAngle,
        xFin: this.x + elementJeu.tailleReference - elementJeu.esquiveAngle,
        y: this.y
    };
    this.bordDroit = {
        use: true,
        color: this.colorBase,
        x: this.x + elementJeu.tailleReference,
        yDebut: this.y + elementJeu.esquiveAngle,
        yFin: this.y + elementJeu.tailleReference - elementJeu.esquiveAngle,
    };
    this.bordBas = {
        use: true,
        color: this.colorBase,
        xDebut: this.x + elementJeu.tailleReference - elementJeu.esquiveAngle,
        xFin: this.x + elementJeu.esquiveAngle,
        y: this.y + elementJeu.tailleReference
    };
    this.bordGauche = {
        use: true,
        color: this.colorBase,
        x : this.x,
        yDebut : this.y + elementJeu.tailleReference - elementJeu.esquiveAngle,
        yFin : this.y + elementJeu.esquiveAngle,
    }
}

const verifEvent = function (x, y) {
    elementJeu.tabCarre.forEach(function (element){
        if (x<element.bordHaut.xFin && x>element.bordHaut.xDebut && y<element.bordHaut.y+elementJeu.tolerance && y>element.bordHaut.y-elementJeu.tolerance && element.bordHaut.use) {
            actualTour.compteurDetection += 1
            element.bordHaut.color = element.colorUse;
            element.bordHaut.use = false;
        }
        if (x<element.bordDroit.x+elementJeu.tolerance && x>element.bordDroit.x-elementJeu.tolerance && y<element.bordDroit.yFin && y>element.bordDroit.yDebut  && element.bordDroit.use) {
            actualTour.compteurDetection += 1
            element.bordDroit.color = element.colorUse;
            element.bordDroit.use = false;
        }
        if (x<element.bordGauche.x+elementJeu.tolerance && x>element.bordGauche.x-elementJeu.tolerance && y>element.bordGauche.yFin && y<element.bordGauche.yDebut  && element.bordGauche.use) {
            actualTour.compteurDetection += 1
            element.bordGauche.color = element.colorUse;
            element.bordGauche.use = false;
        }
            
        if (x>element.bordBas.xFin && x<element.bordBas.xDebut && y<element.bordBas.y+elementJeu.tolerance && y>element.bordBas.y-elementJeu.tolerance && element.bordBas.use) {
            actualTour.compteurDetection += 1
            element.bordBas.color = element.colorUse;
            element.bordBas.use = false;
        }
        return actualTour.compteurDetection
    })
}

const verifScoreEtFinJeu = function () {
    elementJeu.tabCarre.forEach(function(element){
        if (!element.bordHaut.use && !element.bordDroit.use && !element.bordBas.use && !element.bordGauche.use && element.propertyOf=='') {
            if (actualTour.socketId == joueur1.socketId) {
                element.color = joueur1.color
                element.propertyOf = joueur1.pseudo
                actualTour.scoreChange = true
                joueur1.score += 1
                if (joueur1.score >= elementJeu.valeurFinJeu) {
                    joueur1.victoire = true
                    elementJeu.finJeu = true
                }
            }
            if (actualTour.socketId == joueur2.socketId) {
                element.color = joueur2.color
                element.propertyOf = joueur2.pseudo
                actualTour.scoreChange = true
                joueur2.score += 1
                if (joueur2.score >= elementJeu.valeurFinJeu) {
                    joueur2.victoire = true
                    elementJeu.finJeu = true
                }
            }
        }
    })
}

const fullRestart = function () {
    joueur1.pseudo = ''
    joueur1.victoire = 'false'
    joueur1.score= 0
    joueur1.socketId= ''
    joueur2.pseudo = ''
    joueur2.victoire = 'false'
    joueur2.score= 0
    joueur2.socketId= ''
    elementJeu.tabCarre = []
    elementJeu.finJeu = false
    actualTour.stopEmit = false
    actualTour.scoreChange = false
    actualTour.socketId = ''
    actualTour.compteurDetection = 0
}

const restartTour = function () {
    actualTour.scoreChange = false
    actualTour.compteurDetection = 0
    actualTour.stopEmit = false
}

io.sockets.on('connect', function (socket) {
    socket.emit('id', socket.id)

    connectOrNotConnect = function (chemin, userIdClient) {
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            const collectionUser = client.db(element.dbName).collection('user')
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
            const collectionUser = client.db(element.dbName).collection('user')
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
                const collectionUser = client.db(element.dbName).collection('user')
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
                        collectionUser.updateOne({
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

//////////////////// CREATION GRILLE



    socket.on('wantPlay', function () {
        console.log('socket', socket.id)
        io.of('/').adapter.clients(["gameRoom"], function (err, clients) {
            ////// ROUTE JOUEUR 2 + DEMARRAGE DU GAME
            if (clients.length == 1) {
                socket.join("gameRoom")
                mongo.connect(element.urlUser, {
                    useNewUrlParser: true
                }, function (err, client) {
                    const collectionUser = client.db(element.dbName).collection('user')
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
                                joueur2.socketId = socket.id
                                fs.readFile(('./public/html/game.html'), function (err, filedata) {
                                    elementJeu.tabCarre = creationGrille()
                                    console.log('++ gameBegin EMIT++' )
                                    io.to("gameRoom").emit('gameBegin', {
                                        filedata: filedata.toString(),
                                        joueur1: joueur1,
                                        joueur2: joueur2,
                                        grille: elementJeu.tabCarre,
                                    })
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
                    const collectionUser = client.db(element.dbName).collection('user')
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
                                joueur1.socketId = socket.id
                                actualTour.socketId = joueur1.socketId
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

    socket.on('clickEvent', function (data) {
        //// y a-t-il un emit en cours de calcul ?
        if (!actualTour.stopEmit) {
            ////// est ce le bon joueur ?    
            if (socket.id == actualTour.socketId) {
                let x = data.offsetX
                let y = data.offsetY
                verifEvent(x,y)
                ////// a-t-il cliqué sur un carré ?        
                if (actualTour.compteurDetection == 2) {
                    verifScoreEtFinJeu()
                    ///// y-a-t-il eu une victoire ?            
                    if (elementJeu.finJeu) {
                        ///// est-ce le joueur 1
                        if (joueur1.victoire) {
                            console.log('++ fin de jeu EMIT' )
                            io.to(joueur1.socketId).emit('finDeJeu', 'victoire')
                            io.to(joueur2.socketId).emit('finDeJeu', 'défaite')
                        ///// est-ce le joueur 2                    
                        } else if (joueur2.victoire) {
                            console.log('++ fin de jeu EMIT' )
                            io.to(joueur2.socketId).emit('finDeJeu', 'victoire')
                            io.to(joueur1.socketId).emit('finDeJeu', 'défaite')
                        }
                        fullRestart()
                    } else {
                    ////// si pas de victoire à ce tour
                        ////// si pas de point marqué, changement joueur                
                        if (!actualTour.scoreChange) {
                            //// au tour du joeur 2
                            if (joueur1.socketId == actualTour.socketId) {
                                actualTour.socketId = joueur2.socketId
                                restartTour()
                                console.log('++ gameRoom EMIT' )
                                io.to("gameRoom").emit('dessinGrille', elementJeu.tabCarre)
                            //// au tour du joueur 1
                            } else if (joueur2.socketId == actualTour.socketId) {
                                actualTour.socketId = joueur1.socketId
                                restartTour()
                                console.log('++ gameRoom EMIT' )
                                io.to("gameRoom").emit('dessinGrille', elementJeu.tabCarre)
                            }
                        //// si point marqué, même joueur
                        } else {
                            restartTour()
                            console.log('++ gameRoom EMIT' )
                            io.to("gameRoom").emit('dessinGrille', elementJeu.tabCarre)
                        } 
                    }
                } else {
                    actualTour.stopEmit = false
                }
            } else {
                actualTour.stopEmit = false
            }
        }   
    })

    

    socket.on('disconnect', function () {
        if (joueur1.socketId == socket.id) {
            io.sockets.clients('gameRoom').forEach(function(s){
                s.leave('gameRoom')
            })
            let message = 'Ton collègue a taillé, soit le jeu l\'a saoulé, soit c\'est à cause de toi (perso, je penche pour la seconde option). Tu repars dans un instant sur ton compte.'
            console.log('++ disconnnectOther' )
            io.to(joueur2.socketId).emit('disconnectOther', message)
            fullRestart()
        } else if (joueur2.socketId == socket.id) {
            io.sockets.clients('gameRoom').forEach(function(s){
                s.leave('gameRoom')
            })
            let message = 'Ton collègue a taillé, soit le jeu l\'a saoulé, soit c\'est à cause de toi (perso, je penche pour la seconde option). Tu repars dans un instant sur ton compte.'
            console.log('++ diconnectOther EMIT' )
            io.to(joueur1.socketId).emit('disconnectOther', message)
            fullRestart()   
        }
    })
})