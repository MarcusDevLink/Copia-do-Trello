$(document).ready(function () {
    const $nomeLoja = $('#nomeLoja');
    const $valorFixo = $('#valorFixo');
    const $btnCadastrar = $('#btnCadastrar');
    const $selectLoja = $('#selectLoja');
    const $btnResetar = $('#btnResetar');
    const $btnExportar = $('#btnExportar');
    const $listaLojas = $('#lista-lojas');
    const $totalLojas = $('#total-lojas');
    const $totalEntregas = $('#total-entregas');
    const $valorTotal = $('#valor-total');
    const LIMITE_HISTORICO = 20;


    let lojas = JSON.parse(localStorage.getItem('lojas')) || [];
    let totalEntregas = parseInt(localStorage.getItem('totalEntregas')) || 0;
    let valorTotal = parseFloat(localStorage.getItem('valorTotal')) || 0;

    atualizarSelectLojas();
    atualizarListaLojas();
    atualizarResumo();

    // Evento: cadastrar nova loja
    $btnCadastrar.on('click', function () {
        const nome = $nomeLoja.val().trim();
        const valor = parseFloat($valorFixo.val());

        if (!nome || isNaN(valor) || valor <= 0) {
            alert('Preencha todos os campos corretamente.');
            return;
        }

        if (lojas.some(loja => loja.nome.toLowerCase() === nome.toLowerCase())) {
            alert('Essa loja já está cadastrada!');
            return;
        }

        lojas.push({
            nome,
            valorFixo: valor,
            entregas: 0,
            total: 0,
            historico: []
        });
        
        salvarDados();
        atualizarSelectLojas();
        atualizarListaLojas();
        atualizarResumo();

        $nomeLoja.val('').focus();
        $valorFixo.val('');
    });

    // Evento: registrar entrega
    $('#btnRegistrar').on('click', function () {
    const indiceLoja = $('#selectLoja').prop('selectedIndex') - 1;
    const quantidade = parseInt($('#quantidade').val());
    const modoSubtrair = $('#modoOperacao').val() === 'subtrair';

    if (indiceLoja < 0 || indiceLoja >= lojas.length || isNaN(quantidade) || quantidade <= 0) {
        alert('Preencha os dados corretamente.');
        return;
    }

    const loja = lojas[indiceLoja];
    const dataAtual = new Date();
    const timestamp = `${dataAtual.toLocaleDateString()} ${dataAtual.getHours().toString().padStart(2, '0')}:${dataAtual.getMinutes().toString().padStart(2, '0')}`;

    if (modoSubtrair) {
        if (loja.entregas < quantidade) {
            alert('Não é possível subtrair mais entregas do que já existem.');
            return;
        }
        loja.entregas -= quantidade;
        loja.total -= quantidade * loja.valorFixo;
        totalEntregas -= quantidade;
        valorTotal -= quantidade * loja.valorFixo;

        loja.historico.push(`- ${quantidade} entrega(s) - ${timestamp}`);
    } else {
        loja.entregas += quantidade;
        loja.total += quantidade * loja.valorFixo;
        totalEntregas += quantidade;
        valorTotal += quantidade * loja.valorFixo;

        loja.historico.push(`+ ${quantidade} entrega(s) - ${timestamp}`);
    }

    if (loja.historico.length > LIMITE_HISTORICO ) loja.historico.shift();

    salvarDados();
    atualizarListaLojas();
    atualizarResumo();
    $('#quantidade').val('');
});

    // Evento: resetar dados
    $btnResetar.on('click', function () {
        if (confirm('Deseja resetar todos os dados?')) {
            lojas = [];
            totalEntregas = 0;
            valorTotal = 0;
            salvarDados();
            atualizarSelectLojas();
            atualizarListaLojas();
            atualizarResumo();
        }
    });
    
    // Evento: exportar relatório
    $btnExportar.on('click', function () {
        if (lojas.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        let texto = 'Relatório de Entregas\n\nLojas:\n\n';

        lojas.forEach(loja => {
            texto += `${loja.nome}\n`;
            texto += `Valor Fixo: R$ ${loja.valorFixo.toFixed(2)}\n`;
            texto += `Entregas: ${loja.entregas}\n`;
            texto += `Total: R$ ${loja.total.toFixed(2)}\n`;
            texto += `Últimos 20 registros:\n`;
            if (loja.historico.length === 0) {
                texto += 'Nenhum registro ainda.\n';
            } else {
                loja.historico.forEach(h => {
                    texto += `- ${h}\n`;
                });
            }
            texto += '\n';
        });

        texto += `Resumo Geral:\nLojas: ${lojas.length}\nEntregas: ${totalEntregas}\nValor Total: R$ ${valorTotal.toFixed(2)}\n`;

        const blob = new Blob([texto], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_entregas_${new Date().toLocaleDateString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    function salvarDados() {
        localStorage.setItem('lojas', JSON.stringify(lojas));
        localStorage.setItem('totalEntregas', totalEntregas);
        localStorage.setItem('valorTotal', valorTotal);
    }

    // Atualiza o select de lojas
    function atualizarSelectLojas() {
        $selectLoja.html('<option value="">Selecione uma loja</option>');
        lojas.forEach((loja, i) => {
            $selectLoja.append(`<option value="${i}">${loja.nome} (R$ ${loja.valorFixo.toFixed(2)})</option>`);
        });
    }

    function atualizarListaLojas() {
        $listaLojas.empty();

        if (lojas.length === 0) {
            $listaLojas.html('<p class="no-data">Nenhuma loja cadastrada ainda.</p>');
            return;
        }

        // Cria os cards para cada loja
        lojas.forEach((loja, i) => {
            const $card = $(`
                <div class="loja-card">
                    <div class="delete-btn-container">
                        <button class="btn-delete" data-index="${i}">X</button>
                    </div>
                    <div class="loja-info clickable" data-toggle="${i}">
                        <div class="loja-nome">${loja.nome}</div>
                        <div class="loja-valor">Valor fixo: R$ ${loja.valorFixo.toFixed(2)}</div>
                    </div>
                    <div class="loja-totais">
                        <div>Entregas: ${loja.entregas}</div>
                        <div>Total: R$ ${loja.total.toFixed(2)}</div>
                    </div>
                    <div class="historico-container" style="display: none;">
                        <strong>Últimas Entregas:</strong>
                        <ul>
                            ${
                                loja.historico.length === 0 
                                ? '<li>Sem registros ainda.</li>' 
                                : loja.historico.map(h => `<li>${h}</li>`).join('')
                            }
                        </ul>
                    </div>
                </div>
            `);

            $listaLojas.append($card);
        });

        // Evento: deletar loja
        $('.btn-delete').on('click', function () {
            const index = $(this).data('index');
            deletarLoja(index);
        });

        // Evento: mostrar/ocultar histórico com slideToggle
        $('.loja-info.clickable').on('click', function () {
            $(this).siblings('.historico-container').slideToggle(200);
        });
    }

    // Atualiza o resumo geral
    function atualizarResumo() {
        $totalLojas.text(lojas.length);
        $totalEntregas.text(totalEntregas);
        $valorTotal.text(`R$ ${valorTotal.toFixed(2)}`);
    }

    // Função para deletar loja
    function deletarLoja(index) {
        if (confirm(`Tem certeza que deseja deletar a loja "${lojas[index].nome}"?`)) {
            totalEntregas -= lojas[index].entregas;
            valorTotal -= lojas[index].total;
            lojas.splice(index, 1);
            salvarDados();
            atualizarSelectLojas();
            atualizarListaLojas();
            atualizarResumo();
        }
    }
});
