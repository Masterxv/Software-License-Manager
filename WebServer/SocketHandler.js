const SessionInfo = require('./modules/SessionInfo').SocketSessionInfo;
const SqlScape = require('sqlstring').escape;
const UserAuthenticator = require('./modules/UserAuthenticator');

let io;
let lio;
let app;

/**
 * @type {UserAuthenticator}
 */
let authenticator;

function Listen(server,appHandler,auth)
{
    //Save References
    app = appHandler;
    authenticator = auth;

    //Create socket.io
    io = require('socket.io')(server);

    //Listen to dashboard connections
    io.on("connection",ValidateSocket);

    //Listen to login connections
    lio = io.of("/login");
    lio.on("connection",RegisterLoginPageEvents);
}

function ValidateSocket(socket)
{
    socket.on("auth.validate",function(cookie)
    {
        let sesinfo = new SessionInfo(socket);

        authenticator.ValidateCookie(cookie,sesinfo,function(success,err)
        {
            if(success) RegisterEvents(socket);
        });
    });
}

function RegisterEvents(socket)
{


    /*SOFTWARE API*/
    socket.on("software.list",function()
    {
        //TODO implement error casting
        app.Database.Query("SELECT * FROM `slm_software` ORDER BY `date` DESC",function(results,fields,err)
        {
            let done = false;
            for (let i = 0; i < results.length; i++)
            {
                const result = results[i];
                let query = "SELECT * FROM `slm_software_versions` WHERE `id`='" + result.lastVersion + "';";

                app.Database.Query(query,function(versions,fields,err)
                {
                    if(err)
                    {
                        app.Error("SocketHandler", err.message);

                        results[i].version = "No Versions Found";
                    }
                    else if(versions.length === 0)
                    {
                        results[i].version = "No Versions Found";
                    }
                    else
                    {
                        results[i].version = versions[0].label;
                    }

                    if(i === results.length -1)
                    {
                        socket.emit("software.list",results);
                    }
                });
            }
        });
    });

    socket.on("software.versions.list",function(sid)
    {
        app.Database.Query("SELECT * FROM `slm_software_versions` WHERE `software`=" + SqlScape(sid) + " ORDER BY `date` DESC",function(results,fields,err)
        {
            if(err)
            {
                app.Error("SocketHandler", err.message);
            }

            socket.emit("software.versions.list",results);
        });
    });

    socket.on("settings.list",function()
    {
        app.Database.Query("SELECT * FROM `slm_settings`",function(results,fields,err)
        {
            socket.emit("settings.list",results);
        });
    });

    socket.on("files.basefolder", function()
    {
        let items = app.BaseFileBrowser.ReadBaseFolderSafe();
        socket.emit("files.folderitems",items);
    }); 

    socket.on("files.folder",function(relPath)
    {
        let items = app.BaseFileBrowser.ReadFolderSafe(relPath);
        socket.emit("files.folderitems",items);
    });
}

function RegisterLoginPageEvents(socket)
{
    let sesinfo = new SessionInfo(socket);

    socket.on("auth.login",function(auth)
    {
        authenticator.Authenticate(auth.login, auth.password, sesinfo, function(cookie,success,err)
        {
            if(err || !success)
            {
                socket.emit("failed",err);
                return;
            }

            socket.emit("success",cookie);
        });
    });
}


module.exports = {"Listen":Listen};