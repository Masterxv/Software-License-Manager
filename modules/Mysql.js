const mysql = require('mysql');
let Logger;
let pool;


function Start(config, logger)
{
    //Save logger reference
    Logger = logger;

    //Add entry in the config
    config.multipleStatements = true;

    pool = mysql.createPool(config);
}

async function Query(querystring, callback)
{
    pool.getConnection(function(err,con)
    {
        if(err)
        {
            //Logger.Error("Mysql",err.message);
            callback(null,null,err);
            return;
        }

        con.query(querystring,function(err,results,fields)
        {
            pool.releaseConnection(con);

            if(err)
            {
                //Logger.Error("Mysql",err.message);
                callback(null,null,err);
                return;
            }

            callback(results,fields,err);
        });
    });

}

function QuerySync(querystring, callback)
{
    pool.getConnection(function(err,con)
    {
        if(err)
        {
            //Logger.Error("Mysql",err.message);
            callback(null,null,err);
            return;
        }

        con.query(querystring,function(err,results,fields)
        {
            pool.releaseConnection(con);

            if(err)
            {
                //Logger.Error("Mysql",err.message);
                callback(null,null,err);
                return;
            }

            callback(results,fields,err);
        });
    });

}

async function QueryEmpty(querystring)
{
    pool.getConnection(function(err,con)
    {
        if(err)
        {
            Logger.Error("Mysql",err.message);
            return;
        }

        con.query(querystring,function(err,results,fields)
        {
            pool.releaseConnection(con);

            if(err)
            {
                Logger.Error("Mysql",err.message);
                return;
            }
        });
    });

}

function QueryEmptySync(querystring)
{
    pool.getConnection(function(err,con)
    {
        if(err)
        {
            Logger.Error("Mysql",err.message);
            return;
        }

        con.query(querystring,function(err,results,fields)
        {
            pool.releaseConnection(con);

            if(err)
            {
                Logger.Error("Mysql",err.message);
                return;
            }
        });
    });

}

function Stop()
{
    pool.end();
}

module.exports = {"Query":Query,"QueryEmpty":QueryEmpty,"QuerySync":QuerySync,"QueryEmptySync":QueryEmptySync,"Start":Start,"Stop":Stop};