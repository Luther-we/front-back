////// TODO
// PERSISTENCE CONNECTION
// GESTION DES ERREURS
// TRANSFORMER CODE EN MODULE
// Ajouter bouton quitter game
// APPROFONDIR LA PRESENCE DE JQUERY
// OBJET CONSTRUCTEUR JOUEUR
// OBJET CONSCTRUCTEUR PARTIE
// MULTIPARTIE SAME TIME
// ANIMATIONSSSS
// DECIDER DU NOMBRE DE CARRE
// RUPTURE DES Hx EN CSS + NETTOYER
// virer les fonctions anonyme
// solutionner le problème de ctx dans le fichier game (function pour emit )
// 2015 OU V5, il faut choirsir !
// le tenter avec Meteor

/////////// POUR CORRECTEUR
//// Salut ! ça va ? Bon, honnêtement, vu la qualité du code, je te souhaite bon courage. Hésite pas par contre à
// m'indiquer les points que je devrais revoir, les fautes trop courantes... Histoire que je progresse. Merci et bisous


//////////////////// REQUIRE / SERVEUR
const mongo = require('mongodb').MongoClient;
const express = require('express');
const path = require('path');
const fs = require('fs');
const SocketIO = require('socket.io');
const PORT = process.env.PORT || 5000;

//////////////////// CONNEXION SERVEUR
const app = express();
const server = require('http').Server(app);
const io = new SocketIO(server);
server.listen(PORT, () => console.log(`Listening on ${ PORT}`));

//////////////////// USE / SET
app.use('/html', express.static(path.join(__dirname + '/public/html/')));
app.use('/css', express.static(path.join(__dirname + '/public/css/')));
app.use('/js', express.static(path.join(__dirname + '/public/js/')));
app.use('/lib', express.static(path.join(__dirname + '/node_modules/jquery/dist/')));
app.use('/lib', express.static(path.join(__dirname + '/node_modules/socket.io-client/dist/')));
app.use('/lib', express.static(path.join(__dirname + '/node_modules/jquery-validation/dist/')));

const element = {
    urlUser: "mongodb://heroku_rgz600fc:ttq2i95ffer6i8aj4958tcgkut@ds141902.mlab.com:41902/heroku_rgz600fc",
    urlHight: "mongodb://heroku_rgz600fc:ttq2i95ffer6i8aj4958tcgkut@ds141902.mlab.com:41902/heroku_rgz600fc",
    dbName: "heroku_rgz600fc"
    // dbName: "db",
    // urlUser: "mongodb://localhost:27017/user",
    // urlHight: "mongodb://localhost:27017/hight"
};

let joueur1 = {
    color: "blue",
    victoire: false,
    pseudo: '',
    score: 0,
    socketId: ''
};

let joueur2 = {
    color: "red",
    victoire: false,
    pseudo: '',
    score: 0,
    socketId: ''
};

let elementJeu = {
    nbCarre: 8,
    tailleReference: 50,
    tabCarre: [],
    esquiveAngle: 5,
    tolerance: 3,
    valeurFinJeu: 10,
    finJeu: false
};

let actualTour = {
    stopEmit: false,
    scoreChange: false,
    socketId: '',
    compteurDetection: 0
};

let messages = {
    errorConnect: "",
    errorCreate: "",
    disconnectOther: 'Ton collègue a taillé, soit le jeu l\'a saoulé, soit c\'est à cause de toi (perso, je penche pour la seconde option). Tu repars dans un instant sur ton compte.',
};

app.get('/', function (req, res, next) {
    res.sendFile('./public/html/paper.html', {
        root: './'
    })
});

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
    this.id = "" + x + y;
    this.propertyOf = '';
    this.xMemoire = x;
    this.yMemoire = y;
    this.x = this.xMemoire * elementJeu.tailleReference;
    this.y = this.yMemoire * elementJeu.tailleReference;
    this.colorBase = '#BDDAFF';
    this.colorUse = "#000000";
    this.lineWidthBase = 2;
    this.lineWidthUse = 3;
    this.bordHaut = {
        use: true,
        lineWidth: this.lineWidthBase,
        color: this.colorBase,
        xDebut: this.x + elementJeu.esquiveAngle,
        xFin: this.x + elementJeu.tailleReference - elementJeu.esquiveAngle,
        y: this.y
    };
    this.bordDroit = {
        use: true,
        lineWidth: this.lineWidthBase,
        color: this.colorBase,
        x: this.x + elementJeu.tailleReference,
        yDebut: this.y + elementJeu.esquiveAngle,
        yFin: this.y + elementJeu.tailleReference - elementJeu.esquiveAngle,
    };
    this.bordBas = {
        use: true,
        lineWidth: this.lineWidthBase,
        color: this.colorBase,
        xDebut: this.x + elementJeu.tailleReference - elementJeu.esquiveAngle,
        xFin: this.x + elementJeu.esquiveAngle,
        y: this.y + elementJeu.tailleReference
    };
    this.bordGauche = {
        use: true,
        lineWidth: this.lineWidthBase,
        color: this.colorBase,
        x: this.x,
        yDebut: this.y + elementJeu.tailleReference - elementJeu.esquiveAngle,
        yFin: this.y + elementJeu.esquiveAngle,
    }
}

const verifEvent = function (x, y) {
    elementJeu.tabCarre.forEach(function (element) {
        if (x < element.bordHaut.xFin && x > element.bordHaut.xDebut && y < element.bordHaut.y + elementJeu.tolerance && y > element.bordHaut.y - elementJeu.tolerance && element.bordHaut.use) {
            actualTour.compteurDetection += 1;
            element.bordHaut.lineWidth = element.lineWidthUse;
            element.bordHaut.color = element.colorUse;
            element.bordHaut.use = false;
        }
        if (x < element.bordDroit.x + elementJeu.tolerance && x > element.bordDroit.x - elementJeu.tolerance && y < element.bordDroit.yFin && y > element.bordDroit.yDebut && element.bordDroit.use) {
            actualTour.compteurDetection += 1;
            element.bordDroit.lineWidth = element.lineWidthUse;
            element.bordDroit.color = element.colorUse;
            element.bordDroit.use = false;
        }
        if (x < element.bordGauche.x + elementJeu.tolerance && x > element.bordGauche.x - elementJeu.tolerance && y > element.bordGauche.yFin && y < element.bordGauche.yDebut && element.bordGauche.use) {
            actualTour.compteurDetection += 1;
            element.bordGauche.lineWidth = element.lineWidthUse;
            element.bordGauche.color = element.colorUse;
            element.bordGauche.use = false;
        }

        if (x > element.bordBas.xFin && x < element.bordBas.xDebut && y < element.bordBas.y + elementJeu.tolerance && y > element.bordBas.y - elementJeu.tolerance && element.bordBas.use) {
            actualTour.compteurDetection += 1;
            element.bordBas.lineWidth = element.lineWidthUse;
            element.bordBas.color = element.colorUse;
            element.bordBas.use = false;
        }
        return actualTour.compteurDetection
    })
};

const verifScoreEtFinJeu = function () {

    elementJeu.tabCarre.forEach(function (element) {
        if (!element.bordHaut.use && !element.bordDroit.use && !element.bordBas.use && !element.bordGauche.use && element.propertyOf == '') {
            if (actualTour.socketId == joueur1.socketId) {
                element.color = joueur1.color;
                element.propertyOf = joueur1.pseudo;
                actualTour.scoreChange = true;
                joueur1.score += 1;
                if (joueur1.score >= elementJeu.valeurFinJeu) {
                    joueur1.victoire = true;
                    elementJeu.finJeu = true
                }
            }
            if (actualTour.socketId == joueur2.socketId) {
                element.color = joueur2.color;
                element.propertyOf = joueur2.pseudo;
                actualTour.scoreChange = true;
                joueur2.score += 1;
                if (joueur2.score >= elementJeu.valeurFinJeu) {
                    joueur2.victoire = true;
                    elementJeu.finJeu = true
                }
            }
        }
    })
};

const fullRestart = function () {
    let tabJoeur = [joueur1, joueur2]
    tabJoeur.forEach(elem => {
        elem.pseudo = '';
        elem.victoire = 'false';
        elem.score = 0;
        elem.socketId = '';
    });
    elementJeu.tabCarre = [];
    elementJeu.finJeu = false;
    actualTour.stopEmit = false;
    actualTour.scoreChange = false;
    actualTour.socketId = '';
    actualTour.compteurDetection = 0
};

const restartTour = function () {
    actualTour.scoreChange = false;
    actualTour.compteurDetection = 0;
    actualTour.stopEmit = false
};

io.sockets.on('connect', function (socket) {

///// FUNCTION AVEC EMIT - KEEP IN SOCKET CONNECT
    const readFileAndEmit = (path, userIdClient, nameEmit, sendFiles) => {
        fs.readFile((path), function (err, result) {
            let filedata = result.toString();
            let data = {filedata, ...sendFiles};
            io.to(userIdClient).emit(nameEmit, data);
        })
    };

    const connectOrNotConnect = function (chemin, userIdClient) {
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            const collectionUser = client.db(element.dbName).collection('user');
            collectionUser.findOne({
                userId: userIdClient
            }, function (err, exist) {
                if (exist) {
                    if (exist.connect) {
                        if (chemin === './public/html/myAccount.html') {
                            mongo.connect(element.urlUser, {useNewUrlParser: true}, function (err, client) {
                                const collectionUser = client.db(element.dbName).collection('user');
                                collectionUser.find({_id: exist._id}, {
                                    score: 1,
                                    _id: 0
                                }).toArray(function (err, exist) {
                                    readFileAndEmit(chemin, userIdClient, 'retourAccount', {exist})
                                })
                            })
                        } else if (chemin === './public/html/wantPlay.html' && ((userIdClient == joueur2.socketId || userIdClient == joueur1.socketId) && joueur1.pseudo != "" && joueur2.pseudo !="")) {
                            readFileAndEmit('./public/html/game.html', userIdClient, 'gameBegin', {
                                scoreJ1: joueur1.score,
                                scoreJ2: joueur2.score,
                                pseudoJ1: joueur1.pseudo,
                                pseudoJ2: joueur2.pseudo,
                                colorJ1: joueur1.color,
                                colorJ2: joueur2.color,
                                color: actualTour.color,
                                objectif: elementJeu.valeurFinJeu,
                                tabCarre: elementJeu.tabCarre
                            })
                        } else {
                            readFileAndEmit(chemin, userIdClient, 'recoi', {});
                        }
                    }
                } else {
                    readFileAndEmit('./public/html/connect.html', userIdClient, 'recoi', {});
                }
            })

        })
    };
///// AU DEMARRAGE DE LA CONNEXION CLIENT
    socket.emit('id', socket.id);
    connectOrNotConnect('./public/html/myAccount.html', socket.id);

///// SOCKET.ON AUTRE QUE LE GAME PUR
    socket.on('account', function (userId) {
        connectOrNotConnect('./public/html/myAccount.html', userId)
    });

    socket.on('rules', function () {
        readFileAndEmit('./public/html/rules.html', socket.id, 'recoi', {});
    });

    socket.on('play', function (userId) {
        connectOrNotConnect('./public/html/wantPlay.html', userId)
    });

    socket.on('hightscore', function () {
        mongo.connect(element.urlHight, {useNewUrlParser: true}, function (err, client) {
            const collectionHight = client.db(element.dbName).collection('hight');
            collectionHight.find().toArray(function (err, exist) {
                readFileAndEmit('./public/html/hightscore.html', socket.id, 'retourHightscore', {exist});
            })
        });
    });

    socket.on('about', function () {
        readFileAndEmit('./public/html/about.html', socket.id, 'recoi', {});
    });

    socket.on('toCreateAccount', function () {
        readFileAndEmit('./public/html/createAccount.html', socket.id, 'recoi', {});
    });

    socket.on('inscription', function (data) {
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            const collectionUser = client.db(element.dbName).collection('user');
            collectionUser.findOne({pseudo: data.pseudo}, function (err, exist) {
                if (exist) {
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
                        color: data.color,
                        connect: true
                    }, function (err, insertOk) {
                        readFileAndEmit('./public/html/myAccount.html', socket.id, 'retourInscription', {success: true});
                    })
                }
            })
        })
    });

    socket.on('submitConnect', function (data) {
        mongo.connect(element.urlUser, {
            useNewUrlParser: true
        }, function (err, client) {
            const collectionUser = client.db(element.dbName).collection('user');
            collectionUser.findOne({
                $and: [{pseudo: data.pseudo}, {mdp: data.mdp}]
            }, function (err, exist) {
                if (exist) {
                    collectionUser.updateOne({_id: exist._id}, {$set: {userId: data.userId, connect: true}});
                    readFileAndEmit('./public/html/myAccount.html', socket.id, 'retourConnect', {message: true})
                } else {
                    readFileAndEmit('./public/html/connect.html', socket.id, 'retourConnect', {message: false});
                }
            })
        })
    });

//////////////////// CREATION GRILLE


    socket.on('wantPlay', function () {
        io.of('/').adapter.clients(["gameRoom"], function (err, clients) {
            ////// ROUTE JOUEUR 2 + DEMARRAGE DU GAME
            if (clients.length == 1) {
                /// Eviter la connexion du même joueur s'il clique sur Commencer une partie
                if (socket.id != clients[0]) {
                    socket.join("gameRoom");
                    mongo.connect(element.urlUser, {
                        useNewUrlParser: true
                    }, function (err, client) {
                        const collectionUser = client.db(element.dbName).collection('user');
                        collectionUser.findOne({
                            userId: socket.id
                        }, function (err, exist) {
                            if (exist) {
                                joueur2.pseudo = exist.pseudo;
                                joueur2.color = exist.color;
                                joueur2.score = 0;
                                joueur2.socketId = socket.id;
                                elementJeu.tabCarre = creationGrille();
                                readFileAndEmit('./public/html/game.html', 'gameRoom', 'gameBegin', {
                                    scoreJ1: joueur1.score,
                                    scoreJ2: joueur2.score,
                                    pseudoJ1: joueur1.pseudo,
                                    pseudoJ2: joueur2.pseudo,
                                    colorJ1: joueur1.color,
                                    colorJ2: joueur2.color,
                                    color: actualTour.color,
                                    objectif: elementJeu.valeurFinJeu,
                                    tabCarre: elementJeu.tabCarre
                                })
                            } else {
                                readFileAndEmit('./public/html/connect.html', socket.id, 'recoi', {});
                            }
                        })
                    })
                } else {
                    readFileAndEmit('./public/html/waitingForPlaying.html', socket.id, 'recoi', {});
                }

                ////// ROUTE JOUEUR 1
            } else if (clients.length == 0) {
                socket.join("gameRoom");
                //////////////////////////////////////
                mongo.connect(element.urlUser, {useNewUrlParser: true}, function (err, client) {
                    const collectionUser = client.db(element.dbName).collection('user');
                    collectionUser.findOne({
                        userId: socket.id
                    }, function (err, exist) {
                        if (exist) {
                            joueur1.pseudo = exist.pseudo;
                            joueur1.color = exist.color;
                            joueur1.score = 0;
                            joueur1.socketId = socket.id;
                            actualTour.socketId = joueur1.socketId;
                            actualTour.color = joueur1.color;
                            readFileAndEmit('./public/html/waitingForPlaying.html', socket.id, 'recoi', {});
                        } else {
                            readFileAndEmit('./public/html/connect.html', socket.id, 'recoi', {});
                        }
                    })
                })
            } else {
                readFileAndEmit('./public/html/tooMuchUser.html', socket.id, 'recoi', {});
            }
        })
    });

    const finDeJeu = (socketVainqueur, socketPerdant) => {
        readFileAndEmit('./public/html/victory.html', socketVainqueur, 'finDeJeu', {});
        readFileAndEmit('./public/html/loosingMyReligion.html', socketPerdant, 'finDeJeu', {});
    };

    socket.on('clickEvent', function (data) {
        //// y a-t-il un emit en cours de calcul ?
        if (!actualTour.stopEmit) {
            ////// est ce le bon joueur ?
            if (socket.id == actualTour.socketId) {
                let x = data.offsetX;
                let y = data.offsetY;
                verifEvent(x, y);
                ////// a-t-il cliqué sur un carré ?
                if (actualTour.compteurDetection >= 1) {
                    verifScoreEtFinJeu();
                    ///// y-a-t-il eu une victoire ?
                    if (elementJeu.finJeu) {
                        ///// est-ce le joueur 1
                        if (joueur1.victoire) {
                            finDeJeu(joueur1.socketId, joueur2.socketId)
                            ///// est-ce le joueur 2
                        } else if (joueur2.victoire) {
                            finDeJeu(joueur2.socketId, joueur1.socketId)
                        }
                        joueur1.scoreAdverse = joueur2.score;
                        joueur1.pseudoAdverse = joueur2.pseudo;
                        joueur2.scoreAdverse = joueur1.score;
                        joueur2.pseudoAdverse = joueur1.pseudo;
                        let tabInsertionIndividuelle = [joueur1, joueur2];
                        tabInsertionIndividuelle.forEach(function (elem) {
                            mongo.connect(element.urlUser, {useNewUrlParser: true}, function (err, client) {
                                const collectionUser = client.db(element.dbName).collection('user');
                                collectionUser.updateOne({pseudo: elem.pseudo}, {
                                    $push: {
                                        score: {
                                            scoreJoueur: elem.score,
                                            scoreAdverse: elem.scoreAdverse,
                                            pseudoAdverse: elem.pseudoAdverse,
                                            win: elem.victoire
                                        }
                                    }
                                })
                            })
                        });
                        mongo.connect(element.urlHight, {useNewUrlParser: true}, function (err, client) {
                            const collectionHight = client.db(element.dbName).collection('hight');
                            let document = {
                                pseudoJ1: joueur1.pseudo,
                                scoreJ1: joueur1.score,
                                pseudoJ2: joueur2.pseudo,
                                scoreJ2: joueur2.score
                            };
                            collectionHight.insertOne(document)
                        });
                        setTimeout(fullRestart, 1000)

                    } else {
                        ////// si pas de victoire à ce tour
                        ////// si pas de point marqué, changement joueur
                        if (!actualTour.scoreChange) {
                            //// au tour du joeur 2
                            if (joueur1.socketId === actualTour.socketId) {
                                actualTour.socketId = joueur2.socketId;
                                actualTour.color = joueur2.color;
                                restartTour();
                                emitTourParTour();
                                //// au tour du joueur 1
                            } else if (joueur2.socketId === actualTour.socketId) {
                                actualTour.socketId = joueur1.socketId;
                                actualTour.color = joueur1.color;
                                restartTour();
                                emitTourParTour();
                            }
                            //// si point marqué, même joueur
                        } else {
                            restartTour();
                            emitTourParTour();
                        }
                    }
                } else {
                    actualTour.stopEmit = false
                }
            } else {
                actualTour.stopEmit = false
            }
        }
    });

    const emitTourParTour = () => {
        io.to("gameRoom").emit('dessinGrille', {
            scoreJ1: joueur1.score,
            scoreJ2: joueur2.score,
            pseudoJ1: joueur1.pseudo,
            pseudoJ2: joueur2.pseudo,
            colorJ1: joueur1.color,
            colorJ2: joueur2.color,
            color: actualTour.color,
            objectif: elementJeu.valeurFinJeu,
            tabCarre: elementJeu.tabCarre,
        })
    };

    socket.on('leaveRoom', function () {
        socket.leave('gameRoom');
    });

    const disconnectUser = (userSocketId) => {
        mongo.connect(element.urlUser, {useNewUrlParser: true}, function (err, client) {
            const collectionUser = client.db(element.dbName).collection('user');
            collectionUser.findOne({userId: userSocketId}, function (err, exist) {
                collectionUser.updateOne({userId: userSocketId}, {$set: {userId: "", connect: false}})
            });
        });
    };

    socket.on('seDeconnecter', function () {
        emptyRoom(socket);
        disconnectUser(socket.id);
        setTimeout(() => {
            connectOrNotConnect('./public/html/myAccount.html', socket.id)
        }, 500);

    });

    socket.on('askForDelete', function () {
        readFileAndEmit('./public/html/askToDelete.html', socket.id, 'confirmDelete', {});
    });

    const emptyRoom = (userSocket) => {
        if (joueur1.socketId == userSocket.id || joueur2.socketId == userSocket.id) {
            userSocket.leave('gameRoom');
            readFileAndEmit('./public/html/diconnectOther.html', 'gameRoom', 'disconnectOther', {message: messages.disconnectOther});
            fullRestart();
        }
    };

    socket.on('deleteIsConfirm', function () {
        mongo.connect(element.urlUser, {useNewUrlParser: true}, function (err, client) {
            const collectionUser = client.db(element.dbName).collection('user');
            try {
                collectionUser.deleteOne({userId: socket.id});
            } catch (e) {
                console.log(e)
            }
        });
        emptyRoom(socket);
        readFileAndEmit('./public/html/deleteAccount.html', socket.id, 'deleteOk', {});
        setTimeout(() => {
            connectOrNotConnect('./public/html/myAccount.html', socket.id)
        }, 4000);
    });

    socket.on('deleteIsAbord', function () {
        connectOrNotConnect('./public/html/myAccount.html', socket.id)
    });

    socket.on('disconnect', function () {
        emptyRoom(socket);
        disconnectUser(socket.id);
    });
});