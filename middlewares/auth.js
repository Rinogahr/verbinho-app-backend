require("dotenv").config();
const { request } = require("http");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");


// arquivo criado para configurar  a autorização de adm ou não apenas a configuarção de adm foi criado no momento irei criar a outra depois
module.exports = { // exportando a função pa ra poder utilizar em outros lugares
    eAdmin: async function(req, res, next){
     const autorizarHeader  = req.headers.authorization; // vareavel que irá receber a autentificação do token gerado

     //console.log('é admin > ',autorizarHeader);
        if(!autorizarHeader){
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário efetuar login e senha para acessar a pagina ! Token A não informado"
            });
        }
        const [, token] = autorizarHeader.split(' ');

        if(!token){
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário efetuar login e senha para acessar a pagina ! Token B não informado"
            });
        }

        try {
            const decode = await promisify(jwt.verify)(token,process.env.JWT_KEY);
            // const decode = await promisify(jwt.verify)(autorizarHeader,key);

            req.user = decode;
            return next();
        } catch (error) {
            return res.status(500).json({
                erro: error,
                mensagem: "Erro: Necessário efetuar login e senha para acessar a pagina ! Token inválido"
            });

        }
    }
}

// rota utilizadas
//http://localhost:3002/ < esse precisa do token gerado
// http://localhost:3002/login < essa cria o token

//https://www.youtube.com/watch?v=F4SEC4f5hAE&t=123s << continuar assitindo a esse video