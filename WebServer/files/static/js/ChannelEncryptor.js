const crypto = require("crypto");
const scrypt = require("scryptsy");
var eSocket = io();

var encryptionConstants = 
    {
        "encoding": "base64",
        "cipher": "aes-256-ctr",
        "iv": new Uint8Array(),
        "salt": new Uint8Array(),
        "keyLenght": 32,
    };

eSocket.on("encrypt.constants",function(data)
{
    encryptionConstants = data;
    encryptionConstants.iv = new Uint8Array(encryptionConstants.iv);
});

if(true || sessionStorage.getItem("secret") == null || sessionStorage.getItem("secret") == "")
{
    eSocket.on("encrypt.keys",function(data)
    {
        sessionStorage.setItem("id",socket.id);
        sessionStorage.setItem("serverKeys", data);

        var primeBuffer = new Uint8Array(data.prime);
        var genBuffer = new Uint8Array(data.generator);
        var pubBuffer = new Uint8Array(data.publickey);

        var diffie = crypto.createDiffieHellman(primeBuffer,genBuffer);
        var publickey = diffie.generateKeys();

        var tempSecret = diffie.computeSecret(pubBuffer);
        
        //var saltBuff = new Uint8Array(data.salt);
        var key = scrypt(tempSecret, encryptionConstants.salt, encryptionConstants.scrypt.N, encryptionConstants.scrypt.r, encryptionConstants.scrypt.p,
            encryptionConstants.keyLenght);
        //var keyBuff = new Uint8Array(key);
        var keyBuff = key;

        sessionStorage.setItem("secret",JSON.stringify(keyBuff));
        eSocket.emit("encrypt.keys",{"publickey": publickey});
    });

    eSocket.on("encrypt.verify",function(data)
    {
        var dec = Decrypt(data);

        var ec = Encrypt(dec);
        eSocket.emit("encrypt.verify",ec);
    });

    eSocket.on("encrypt.success",function()
    {
        console.log("Socket channels are now encrypted!");
    });
}
else
{
    eSocket.emit("encrypt.encrypted");
}

function Encrypt(msg)
{
    var msgStr = JSON.stringify(msg);

    var secret = Uint8Array.from(JSON.parse(sessionStorage.getItem("secret")).data);
    var cipher = crypto.createCipheriv(encryptionConstants.cipher,secret,encryptionConstants.iv);

    var out = cipher.update(msgStr,'utf8',encryptionConstants.encoding);
    return out + cipher.final(encryptionConstants.encoding);
}

function Decrypt(msg)
{
    var secret = Uint8Array.from(JSON.parse(sessionStorage.getItem("secret")).data);

    var cipher = crypto.createDecipheriv(encryptionConstants.cipher,secret,encryptionConstants.iv);
    var out = cipher.update(msg,encryptionConstants.encoding,'utf8');
    
    var msg = out + cipher.final('utf8');
    return JSON.parse(msg);
}