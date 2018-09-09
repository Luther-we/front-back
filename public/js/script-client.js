window.addEventListener("DOMContentLoaded", function () {
    const socket = io();
    let element = {};

    $("#account").click(function () {
        socket.emit("account", element.userId)
    });

    $("#rules").click(function () {
        socket.emit("rules")
    });

    $("#play").click(function () {
        socket.emit("play", element.userId)
    });

    $("#hightscore").click(function () {
        socket.emit("hightscore")
    });

    $("#about").click(function () {
        socket.emit("about")
    });
    //////////////////// SOCKET EMIT
    emitToCreateAccount = function () {
        socket.emit("toCreateAccount")
    };

    emitReqInscription = function () {
        $("#submitInscription").css("display", "none");
        let prenom = $("#prenom").val();
        let nom = $("#nom").val();
        let pseudo = $("#pseudo").val();
        let mail = $("#mail").val();
        let mdp = $("#mdp").val();
        let color = $("#color").val();
        let userId = element.userId;
        socket.emit("inscription", {
            prenom,
            nom,
            pseudo,
            mail,
            mdp,
            color,
            userId
        });
        return false
    };

    emitNewGame = function () {
        socket.emit("wantPlay");
    };

    emitDisconnect = function () {
        $("#toDisconnect").css("display", "none");
        $("#toDeleteAccount").css("display", "none");
        socket.emit("seDeconnecter")
    };

    emitReqConnexion = function () {
        $("#submitToConnect").css("display", "none");
        let pseudo = $("#pseudo").val();
        let mdp = $("#mdp").val();
        let userId = element.userId;
        socket.emit("submitConnect", {
            pseudo,
            mdp,
            userId
        });
        return false
    };

    wantPlayEmit = function () {
        $("#wantPlay").css("display", "none");
        socket.emit("wantPlay");
        return false
    };

    emitMyAccount = function () {
        socket.emit("account", element.userId)
    };

    emitDeleteAccount = function () {
        $("#toDisconnect").css("display", "none");
        $("#toDeleteAccount").css("display", "none");
        socket.emit("askForDelete");
    };

    //////////////////// SOCKET ON
    socket.on("id", function (data) {
        element.userId = data
    });

    socket.on("recoi", function (data) {
        displayFiledata(data.filedata);
    });

    socket.on("retourAccount", function (data) {
        displayFiledata(data.filedata);
        if (typeof data.exist[0].score != "undefined") {
            writeDataJoeur(data.exist[0].score)
        }
    });

    socket.on("retourHightscore", function (data) {
        displayFiledata(data.filedata);
        writeDataHightscore(data.exist);
    });

    socket.on("retourConnect", function (data) {
        if (data.message === true) {
            displayFiledata(data.filedata);
        } else {
            $("#submitToConnect").css("display", "inline");
            $("#errorMessage").empty();
            $("#errorMessage").css("display", "block");
            $("#errorMessage").html("Cet utilisateur ou ce mot de passe n\'existe pas ou alors ils ne vont pas ensemble (comme la majorité des couples)");
        }
    });

    socket.on("retourInscription", function (data) {
        if (data.success) {
            displayFiledata(data.filedata);
        } else {
            $("#submitInscription").css("display", "block");
            let errorMessage = $("#errorPseudo");
            errorMessage.css("display", "block");
            errorMessage.innerHTML = "Ce pseudo est déjà attribué"
        }
    });

    socket.on("confirmDelete", function (data) {
        displayFiledata(data.filedata);
        $("#yesConfirm").click(function () {
            socket.emit("deleteIsConfirm")
        })
        $("#noConfirm").click(function () {
            socket.emit("deleteIsAbord")
        })
    });

    socket.on("deleteOk", function (data) {
        displayFiledata(data.filedata);
    });


//////////////// THE GAME !!!!!!!!!!!!!!!!!
    socket.on("gameBegin", function (data) {
        displayFiledata(data.filedata);
        setTimeout(function () {
            drawGrille(data.tabCarre);
            drawDetailsGame(data);
        }, 800)
    });

    const displayFiledata = function (data) {
        $("#contenu").empty();
        $("#contenu").append(data);
    }
    socket.on("dessinGrille", function (data) {
        drawGrille(data.tabCarre);
        drawDetailsGame(data);
    });

    socket.on("finDeJeu", function (data) {
        displayFiledata(data.filedata);
        socket.emit("leaveRoom")
    });

    socket.on("disconnectOther", function (data) {
        displayFiledata(data.filedata);
        $("#message").html(data.message);
        socket.emit("leaveRoom");
    });

    clickEventEmit = function (event) {
        let offsetX = event.offsetX;
        let offsetY = event.offsetY;
        socket.emit("clickEvent", {offsetX, offsetY})
    };

    const drawDetailsGame = function (data) {
        $("#joueur1").empty();
        $("#score1").empty();
        $("#joueur2").empty();
        $("#score2").empty();
        $("#but").empty();
        $("#joueur1").html(data.pseudoJ1);
        $("#score1").html(data.scoreJ1);
        $("#joueur2").html(data.pseudoJ2);
        $("#score2").html(data.scoreJ2);
        $("#but").html(data.objectif);
        $("#tour").css("backgroundColor", data.color);
        $("#joueur1").css("backgroundColor", data.colorJ1);
        $("#joueur2").css("backgroundColor", data.colorJ2);
    };
}, false);