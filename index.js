require('dotenv').config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { eAdmin } = require("./middlewares/auth"); //arquivo para autentificação com as configurações de adm ou não apenas criado com adm
const { json } = require("express");

const app = express();




let DADOS_CRIPTOGRAFAR = {
    alg : 'aes-256-ctr',
    pwd : 'batatarpm1589abc',
    tipo: "hex"
};

const db = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    dateStrings: process.env.DATESTRINGS
});

app.use(express.json());
app.use(cors());

 let nomeCompleto = '';
 let eMail = '';
 let sexo = '';
 let funcao = '';
 let dgLogin = '';
 let dgSenha = '';
 let dataNasc = '';



app.post('/cadastro', function ( req, res) {
    eMail = req.body.eMail;
    dgLogin = req.body.dgLogin;
    dgSenha = req.body.dgSenha;

    db.query(`SELECT * FROM membro WHERE email = ?`,
    [eMail], (error, resp) =>{
        if(error){
            console.log(error);
        }else{
            if(resp.length > 0){ //existe membro cadastrado com esse e-mail
                res.status(210).json(resp);
            }else{ // verificando se exite alguém com esse login e senha no sistema
                const cipher = crypto.createCipher(DADOS_CRIPTOGRAFAR.alg,DADOS_CRIPTOGRAFAR.pwd);
                const crypterSenha = cipher.update(dgSenha, 'utf8', 'hex'); //criptografando a senha para comparar
                db.query(`SELECT * FROM usuario WHERE login = ? AND senha = ?`,[dgLogin, crypterSenha],
                ( err, resp2) => {
                    if( err ){
                        console.log(err);
                    }else if(resp2.length == 0){
                        newUsuario(req,res); //criar um novo usuario
                    }else{
                        res.status(200).json(resp2);
                    }
                })

            }
        }
    });
});

function newUsuario(req,res){
    dgLogin = req.body.dgLogin;
    dgSenha = req.body.dgSenha;

    const cipher = crypto.createCipher(DADOS_CRIPTOGRAFAR.alg,DADOS_CRIPTOGRAFAR.pwd);
    const crypterSenha = cipher.update(dgSenha, 'utf8', 'hex');

    db.query(`insert into usuario (login, senha) values ( ?, ? )`,[dgLogin,crypterSenha],
    ( err, resp) => {
        if(err){
            console.log(err);
        }else{ //capturando valores do novo usuário criado
            // const decipher = crypto.createDecipher(DADOS_CRIPTOGRAFAR.alg,DADOS_CRIPTOGRAFAR.pwd);
            // const deCrypterSenha = cipher.update(dgSenha, 'hex', 'utf8');
            db.query(`SELECT * FROM usuario WHERE login = ? AND senha = ?`,[dgLogin,crypterSenha],
            ( erro, queryResp ) => {
                if(erro){
                    console.log(erro);
                }else{
                     resposta = JSON.parse(JSON.stringify(queryResp))
                    createrNewMembro(req,resposta,res);
                }
            })
        }
    })
}

function createrNewMembro(req,queryResp,res){

    nomeCompleto = req.body.nomeCompleto;
    eMail = req.body.eMail;
    sexo = req.body.sexo;
    funcao = req.body.funcao;
    dataNasc = req.body.dataNasc;
    usuarioId = queryResp[0].id;


    db.query(`INSERT INTO membro ( nome, datanasc, sexo, email, dpId, usuId) VALUE ( ?, ?, ?, ?, ?, ? )`,
    [nomeCompleto,dataNasc,sexo,eMail,funcao,usuarioId],
    ( error, resp ) => {
        if( error ){
            console.log( error );
        }else{
            res.status(200).json(resp);
        }
    })

};


//rota para autentificar o usuário e criar o token

app.post('/login', async function ( req, res) { //http://localhost:3001/login
    sala = req.body.sala; // variavel com a salinha escolhida
    usuario = req.body.usuario; // variavel com a login
    senha = req.body.senha; // variavel com a senha

    const cipher = crypto.createCipher(DADOS_CRIPTOGRAFAR.alg,DADOS_CRIPTOGRAFAR.pwd);
    const crypterSenha = cipher.update(senha, 'utf8', 'hex');


    db.query(`SELECT  s.id, s.login
                FROM membro as m,
                    usuario as s
                WHERE
                    m.usuId = s.id
                AND  s.login = ?
                AND  s.senha = ?`,[usuario, crypterSenha], (error, responseSql) =>{
                    if(responseSql.length == 0){
                        res.json({
                            error: true,
                            mensagem: "error: usuario não encontrado login ou senha incorreto!",
                            data: error,
                        });
                    }else{
                        var token = jwt.sign({responseSql}, process.env.JWT_KEY,{ // gerando  o token com o id do usuario e uma chave exclusiva
                            expiresIn: 600 //10min
                            //expiresIn: "7d" // 7 dias
                        });
                        return res.json({ //retornando a resposta do usuário logado com sucesso
                            auth: true,
                            // data: responseSql[0],
                            mensagem: `Usuário valido`, //texto de exemplo
                            token: token, // token gerado
                        });
                    }
                }
    );
});


app.get('/home', eAdmin, async function(req, res){
    return res.json({
        error: false,
        data: req.user.responseSql,
        mensagem: `Usuário logado com sucesso bem vindo(a) ${req.user.responseSql[0].login}`,
    });
})



app.listen( process.env.PORT_CONECTION, ( ) => {
    console.log('Servidor rodando com sucesso na porta ' + process.env.PORT_CONECTION + ' acesse pelo link ::>', `http://localhost:${process.env.PORT_CONECTION}` );
});