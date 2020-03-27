'use strict';

const Criptografia = require('../utils/criptografia');

module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('usuario_base', [{
            id: 1,
            primeiro_nome: "admin",
            ultimo_nome: "",
            email: "admin@localhost",
            senha: Criptografia.criarCriptografiaMd5Utf8("123.456"),
            ativo: 1,
            created_at: '2020-01-01',
            updated_at: '2020-01-01'
        }], {});
    },

    down: (queryInterface, Sequelize) => {
      return queryInterface.bulkDelete('usuario_base', null, {});
    }
};