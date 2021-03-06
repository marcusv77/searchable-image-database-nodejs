"use strict";

// eslint-disable-next-line no-unused-vars
const debug = require("debug")("database.cric:ListarDescricoesExecutor");

const Excecao = require("../../utils/enumeracoes/mensagem_excecoes");
const ObjetoExcecao = require("../../utils/enumeracoes/controle_de_excecoes");
const HttpStatus = require("http-status-codes");
const ImagemRepositorio = require("../../repositorios/imagem_repositorio");

module.exports = {

    async Executar() {
        
        const todasDescricoes = await ImagemRepositorio.listarDescricoes();

        if(todasDescricoes.length == 0) {
            ObjetoExcecao.status = HttpStatus.NOT_FOUND;
            ObjetoExcecao.title = Excecao.DESCRICAO_NAO_ENCONTRADA;
            throw ObjetoExcecao;
        }

        return todasDescricoes;
    }
};
