"use strict";

// eslint-disable-next-line no-unused-vars
const debug = require("debug")("database.cric:CadastrarSegmentacaoCelulaExecutor");

const HttpStatus = require("http-status-codes");
const validator = require("validator");

const UsuarioRepositorio = require("../../repositorios/usuario_repositorio");
const ImagemRepositorio = require("../../repositorios/imagem_repositorio");

const ConverterPonto = require("../../utils/transformacao_de_pontos");
const Excecao = require("../../utils/enumeracoes/mensagem_excecoes");
const ObjetoExcecao = require("../../utils/enumeracoes/controle_de_excecoes");
const gate_keeper = require("../../utils/gate_keeper");

const ListarSegmentacaoCelulaExecutor = require("../imagem_executor/ListarSegmentacaoCelulaExecutor");

module.exports = {

    async Executar(req, res) {

        await validarRequisicao(req);
        const id_usuario = parseInt(req.params.id_usuario);
        const id_imagem = parseInt(req.params.id_imagem);

        const celulaCadastrada = await ImagemRepositorio.cadastrarCelulaSegmentada(id_imagem, req.body.id_descricao);

        if (!celulaCadastrada) {
            ObjetoExcecao.status = HttpStatus.INTERNAL_SERVER_ERROR;
            ObjetoExcecao.title = Excecao.ERRO_AO_CADASTRAR_CELULA;
            ObjetoExcecao.detail = "Failed to create a cell";
            throw ObjetoExcecao;
        }

        const segmentosCitoplasmaCadastradosTask =
            await cadastrarSegmentosCitoplasma(req, celulaCadastrada.dataValues.id, id_usuario);
        const segmentosNucleoCadastradosTask =
            await cadastrarSegmentosNucleo(req, celulaCadastrada.dataValues.id, id_usuario);

        await Promise.all([segmentosCitoplasmaCadastradosTask, segmentosNucleoCadastradosTask]);

        return await ListarSegmentacaoCelulaExecutor.Executar(req, res);
    }
};

async function validarRequisicao(req, res) {

    if (req.body.segmentos_citoplasma.length == 0 ||
        !req.body.larguraOriginalImg || typeof req.body.larguraOriginalImg !== "number" ||
        !req.body.alturaOriginalImg || typeof req.body.alturaOriginalImg !== "number" ||
        !req.body.larguraCanvas || typeof req.body.larguraCanvas !== "number" ||
        !req.body.alturaCanvas || typeof req.body.alturaCanvas !== "number" ||
        !req.body.id_descricao || typeof req.body.id_descricao !== "number") {

        ObjetoExcecao.status = HttpStatus.BAD_REQUEST;
        ObjetoExcecao.title = Excecao.PARAMETROS_INVALIDOS;
        throw ObjetoExcecao;
    }

    validarSegmentacao(req.body.segmentos_citoplasma);
    validarSegmentacao(req.body.segmentos_nucleo);

    const usuarioTask = UsuarioRepositorio.obterUsuarioBasePorId(req.params.id_usuario);
    const imagemTask = ImagemRepositorio.obterImagemPorId(req.params.id_imagem);
    const descricaoTask = ImagemRepositorio.obterDescricaoPorId(req.body.id_descricao);
    const [usuario, imagem, descricao] = await Promise.all([usuarioTask, imagemTask, descricaoTask]);

    if (!usuario) {
        ObjetoExcecao.status = HttpStatus.NOT_FOUND;
        ObjetoExcecao.title = Excecao.USUARIO_BASE_NAO_ENCONTRATO;
        throw ObjetoExcecao;
    }

    if (!descricao) {
        ObjetoExcecao.status = HttpStatus.NOT_FOUND;
        ObjetoExcecao.title = Excecao.LESAO_NAO_ENCONTRADA;
        throw ObjetoExcecao;
    }

    if (!imagem) {
        ObjetoExcecao.status = HttpStatus.NOT_FOUND;
        ObjetoExcecao.title = Excecao.IMAGEM_NAO_ENCONTRADA;
        throw ObjetoExcecao;
    }

    gate_keeper.check_loose_ownership(
        imagem,
        res.locals.user
    );
}


function validarSegmentacao(segmentos) {

    if(segmentos.length > 0) {
        segmentos.forEach(ponto => {
            if(!validator.isNumeric(ponto.coord_x) || !validator.isNumeric(ponto.coord_y)) {
                ObjetoExcecao.status = HttpStatus.NOT_FOUND;
                ObjetoExcecao.title = Excecao.SEGMENTACAO_INVALIDA;
                throw ObjetoExcecao;
            }        
        });
    }    
}

async function cadastrarSegmentosCitoplasma(req, id_celula, id_usuario) {

    let ponto;
    let parametros = {
        coord_x: 0,
        coord_y: 0,
        alturaCanvas: req.body.alturaCanvas,
        larguraCanvas: req.body.larguraCanvas,
        alturaOriginalImg: req.body.alturaOriginalImg,
        larguraOriginalImg: req.body.larguraOriginalImg
    };
    
    for (let i = 0; i < req.body.segmentos_citoplasma.length; i++) {

        parametros.coord_x = req.body.segmentos_citoplasma[i].coord_x;
        parametros.coord_y = req.body.segmentos_citoplasma[i].coord_y;
        ponto = ConverterPonto.converterPontoParaArmazenarNoBanco(parametros);
        await ImagemRepositorio.cadastrarSegmentoCitoplasmaCelula(id_usuario, id_celula, ponto.coord_x, ponto.coord_y);
    }

    return req.body.segmentos_citoplasma.length;
}

async function cadastrarSegmentosNucleo(req, id_celula, id_usuario) {

    if(req.body.segmentos_nucleo.length > 0) {
            
        let ponto; 
        let parametros = {
            coord_x: 0,
            coord_y: 0,
            alturaCanvas: req.body.alturaCanvas,
            larguraCanvas: req.body.larguraCanvas,
            alturaOriginalImg: req.body.alturaOriginalImg,
            larguraOriginalImg: req.body.larguraOriginalImg
        };

        for (let i = 0; i < req.body.segmentos_nucleo.length; i++) {

            parametros.coord_x = req.body.segmentos_nucleo[i].coord_x;
            parametros.coord_y = req.body.segmentos_nucleo[i].coord_y;
            ponto = ConverterPonto.converterPontoParaArmazenarNoBanco(parametros);
            await ImagemRepositorio.cadastrarSegmentoNucleoCelula(id_usuario, id_celula, ponto.coord_x, ponto.coord_y);
        }
    }

    return req.body.segmentos_nucleo.length;
}
