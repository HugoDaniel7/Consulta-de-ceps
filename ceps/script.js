async function consultarCeps() {
    let ceps = document.getElementById("cepInput").value.split("\n").map(c => c.trim()).filter(c => c);
    let resultadoTabela = document.getElementById("resultado").getElementsByTagName("tbody")[0];
    resultadoTabela.innerHTML = ""; // Limpa os resultados anteriores
    
    if (ceps.length > 3800) {
        alert("Por favor, insira no máximo 3.800 CEPs.");
        return;
    }
    
    for (let i = 0; i < ceps.length; i++) {
        let cep = ceps[i];
        try {
            let response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            let data = await response.json();
            if (!data.erro) {
                let row = `<tr>
                    <td>${cep}</td>
                    <td>${data.logradouro || ''}</td>
                    <td>${data.bairro || ''}</td>
                    <td>${data.localidade || ''}</td>
                    <td>${data.uf || ''}</td>
                </tr>`;
                resultadoTabela.innerHTML += row;
            }
        } catch (error) {
            console.error("Erro ao consultar o CEP:", cep);
        }
        await new Promise(resolve => setTimeout(resolve, 150)); // Pequeno delay para evitar bloqueio
    }
}

function baixarCSV() {
    let tabela = document.getElementById("resultado");
    let linhas = tabela.getElementsByTagName("tr");
    let csv = [];
    for (let i = 0; i < linhas.length; i++) {
        let colunas = linhas[i].getElementsByTagName("td");
        let linha = [];
        for (let j = 0; j < colunas.length; j++) {
            linha.push(colunas[j].innerText);
        }
        csv.push(linha.join(","));
    }
    let csvContent = "data:text/csv;charset=utf-8,CEP,Logradouro,Bairro,Cidade,Estado\n" + csv.join("\n");
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "enderecos.csv");
    document.body.appendChild(link);
    link.click();
}