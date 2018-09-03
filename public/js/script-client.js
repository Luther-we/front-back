window.addEventListener('DOMContentLoaded', function () {
    // valeur en dev
    const socket = io.connect()
    // valeur en prod
    // const socket = io.connect('http://155.133.132.6:8080/')

    let element = {}



    $(function () {

        $('#account').click(function () {
            socket.emit('account', element.userId)
        })

        $('#rules').click(function () {
            socket.emit('rules')
        })

        $('#play').click(function () {
            socket.emit('play', element.userId)
            console.log('ok')
        })

        $('#hightscore').click(function () {
            socket.emit('hightscore')
        })

        $('#about').click(function () {
            socket.emit('about')
        })
        //////////////////// SOCKET EMIT
        emitToCreateAccount = function () {
            console.log('emit createAccount')
            socket.emit('toCreateAccount')
        }

        emitReqInscription = function () {
            document.getElementById('submitInscription').style.display = "none"
            let prenom = document.getElementById('prenom').value
            let nom = document.getElementById('nom').value
            let pseudo = document.getElementById('pseudo').value
            let mail = document.getElementById('mail').value
            let mdp = document.getElementById('mdp').value
            let userId = element.userId
            console.log('// Emit client - inscription - = ', prenom, nom, pseudo, mail, mdp)
            socket.emit('inscription', {
                prenom,
                nom,
                pseudo,
                mail,
                mdp,
                userId
            })
            return false
        }

        emitReqConnexion = function () {
            document.getElementById('submitToConnect').style.display = "none"
            let pseudo = document.getElementById('pseudo').value
            let mdp = document.getElementById('mdp').value
            let userId = element.userId
            console.log('// Emit client - inscription - = ', pseudo, mdp)
            socket.emit('submitConnect', {
                pseudo,
                mdp,
                userId
            })
            return false
        }

        wantPlayEmit = function () {
            document.getElementById('wantPlay').style.display = "none"
            socket.emit('wantPlay')
            return false
        }

        

    })
    //////////////////// SOCKET ON
    socket.on('id', function (data) {
        element.userId = data
        console.log(element)
    })

    socket.on('recoi', function (data) {
        $('#contenu').empty()
        $('#contenu').append(data)
    })

    socket.on('retourConnect', function (data) {
        console.log('++ On client - retourConnexion - = ', data)
        if (data.message) {
            $('#contenu').empty()
            $('#contenu').append(data.filedata)
        } else {
            document.getElementById('submitToConnect').style.display = "block"
            let errorMessage = document.getElementById('errorMessage')
            errorMessage.style.display = "block"
            errorMessage.innerHTML = 'Cet utilisateur ou ce mot de passe n\'existe pas ou alors ils ne vont pas ensemble'
        }
    })

    socket.on('retourInscription', function (data) {
        console.log('++ On client - retourInscription - = ', data.console)
        if (data.success) {
            $('#contenu').empty()
            $('#contenu').append(data.filedata)
        } else {
            document.getElementById('submitInscription').style.display = "block"
            let errorMessage = document.getElementById('errorPseudo')
            errorMessage.style.display = "block"
            errorMessage.innerHTML = 'Ce pseudo est déjà attribué'
        }
    })
//////////////// THE GAME !!!!!!!!!!!!!!!!!


    socket.on('demarrageGame', function (data) {
        console.log(data)
        $('#contenu').empty()
        $('#contenu').append(data.filedata)
        $('#joueur1').append(data.joueur1.pseudo)
        $('#score1').append(data.joueur1.score)
        $('#joueur2').append(data.joueur2.pseudo)
        $('#score2').append(data.joueur2.score)
        // socket.emit('askForGrille')
    })

    // socket.on('grille')

}, false)