async function consultarCeps() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    const resultsSection = document.getElementById("resultsSection");
    loadingIndicator.style.display = "block";
    
    let ceps = document.getElementById("cepInput").value.split("\n").map(c => c.trim()).filter(c => c);
    let resultadoTabela = document.getElementById("resultado").getElementsByTagName("tbody")[0];
    resultadoTabela.innerHTML = ""; // Limpa os resultados anteriores
    
    if (ceps.length === 0) {
        alert("Por favor, insira pelo menos um CEP.");
        loadingIndicator.style.display = "none";
        resultsSection.style.display = "none";
        return;
    }
    
    if (ceps.length > 3800) {
        alert("Por favor, insira no máximo 3.800 CEPs.");
        loadingIndicator.style.display = "none";
        resultsSection.style.display = "none";
        return;
    }
    
    try {
        // Mostra a seção de resultados
        resultsSection.style.display = "block";
        
        for (let i = 0; i < ceps.length; i++) {
            let cep = ceps[i].replace(/\D/g, ''); // Remove não dígitos
            
            // Verifica se o CEP tem 8 dígitos
            if (cep.length !== 8) {
                resultadoTabela.innerHTML += `
                    <tr>
                        <td>${cep}</td>
                        <td colspan="4" style="color: red; text-align: center;">CEP inválido (deve ter 8 dígitos)</td>
                    </tr>`;
                continue;
            }
            
            try {
                let response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                let data = await response.json();
                
                if (!data.erro) {
                    let row = `<tr>
                        <td>${cep}</td>
                        <td>${data.logradouro || 'N/A'}</td>
                        <td>${data.bairro || 'N/A'}</td>
                        <td>${data.localidade || 'N/A'}</td>
                        <td>${data.uf || 'N/A'}</td>
                    </tr>`;
                    resultadoTabela.innerHTML += row;
                } else {
                    resultadoTabela.innerHTML += `
                        <tr>
                            <td>${cep}</td>
                            <td colspan="4" style="color: orange; text-align: center;">CEP não encontrado</td>
                        </tr>`;
                }
            } catch (error) {
                console.error("Erro ao consultar o CEP:", cep, error);
                resultadoTabela.innerHTML += `
                    <tr>
                        <td>${cep}</td>
                        <td colspan="4" style="color: red; text-align: center;">Erro na consulta</td>
                    </tr>`;
            }
            
            // Pequeno delay para evitar bloqueio
            if (i < ceps.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }
    } finally {
        loadingIndicator.style.display = "none";
    }
}

function baixarCSV() {
    let tabela = document.getElementById("resultado");
    let linhas = tabela.getElementsByTagName("tr");
    
    if (linhas.length <= 1) {
        alert("Nenhum dado para exportar. Por favor, consulte alguns CEPs primeiro.");
        return;
    }
    
    let csv = [];
    // Cabeçalho
    let header = [];
    let ths = linhas[0].getElementsByTagName("th");
    for (let i = 0; i < ths.length; i++) {
        header.push(ths[i].innerText.replace(/\n/g, ' ').trim()); // Remove ícones e quebras
    }
    csv.push(header.join(";"));
    
    // Dados
    for (let i = 1; i < linhas.length; i++) {
        let colunas = linhas[i].getElementsByTagName("td");
        let linha = [];
        for (let j = 0; j < colunas.length; j++) {
            linha.push(colunas[j].innerText.replace(/;/g, ',')); // Substitui ; por , para evitar conflitos
        }
        csv.push(linha.join(";"));
    }
    
    let csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "enderecos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function baixarExcel() {
    let tabela = document.getElementById("resultado");
    let linhas = tabela.getElementsByTagName("tr");
    
    if (linhas.length <= 1) {
        alert("Nenhum dado para exportar. Por favor, consulte alguns CEPs primeiro.");
        return;
    }
    
    // Criar um novo workbook
    let wb = XLSX.utils.book_new();
    
    // Converter tabela para worksheet (removendo ícones do cabeçalho)
    let clonedTable = tabela.cloneNode(true);
    let ths = clonedTable.getElementsByTagName("th");
    for (let i = 0; i < ths.length; i++) {
        ths[i].innerHTML = ths[i].innerText; // Remove os ícones
    }
    let ws = XLSX.utils.table_to_sheet(clonedTable);
    
    // Adicionar estilo ao cabeçalho
    if (!ws["!cols"]) ws["!cols"] = [];
    ws["!cols"][0] = { width: 12 }; // Largura da coluna CEP
    
    // Estilo para o cabeçalho
    for (let col in ws) {
        if (col[0] === 'A' && col[1] === '1') { // Células do cabeçalho (A1, B1, etc.)
            ws[col].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4361EE" } }, // Cor do cabeçalho
                alignment: { horizontal: "center" }
            };
        } else if (col[1] !== '1') { // Não é cabeçalho
            ws[col].s = {
                border: {
                    top: { style: "thin", color: { rgb: "E0E0E0" } },
                    left: { style: "thin", color: { rgb: "E0E0E0" } },
                    bottom: { style: "thin", color: { rgb: "E0E0E0" } },
                    right: { style: "thin", color: { rgb: "E0E0E0" } }
                }
            };
        }
    }
    
    // Adicionar o worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, "Endereços");
    
    // Gerar o arquivo Excel
    XLSX.writeFile(wb, "enderecos.xlsx", { compression: true });
}