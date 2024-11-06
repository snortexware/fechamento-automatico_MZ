const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromeOptions = new chrome.Options()
    .addArguments('--start-maximized')
    .addArguments("--headless=new");

async function closeCall() {
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
        // Acessa a página de login
        await driver.get('https://megazap.chat/login.html');

        // Login
        await driver.findElement(By.id('email')).sendKeys('lucas.gramnet');
        await driver.findElement(By.id('password')).sendKeys('Lucas.moreira2');

        // Clica no botão de login
        await driver.findElement(By.css('.btn.btn-lg.btn-block.m-t-20.bgm-black.waves-effect.ng-binding')).click();

        // Espera que a URL da página de chat seja carregada
        await driver.wait(until.urlIs('https://megazap.chat/index.html#/atendimentos/chat'), 3000);
        console.log("Login realizado com sucesso!");
        await driver.sleep(1000); // ❌ Erro: `sleep` não é necessário se o `wait` já foi utilizado acima.
                                   // Isso faz com que o código fique mais lento sem necessidade.

        // Localiza o botão de fechar e clica
        let test = await driver.wait(
            until.elementLocated(By.css('[ng-click="close()"]')),
            1000
        );
        await test.click();

        // Busca os itens de atendimento
        let items = await driver.findElements(By.css('.atendimento-item-content'), 1000); 
        // ❌ Erro: O timeout `1000` não deve ser passado para o `findElements`. O `wait` de Selenium já controla isso.
        // `findElements` deveria ser chamado diretamente e o tempo de espera controlado por `wait` quando necessário.

        for (let item of items) {
            let tags = await item.findElements(By.css('.item-tag.ng-binding.ng-scope'));
            let resolved = false;

            for (let tag of tags) {
                let text = await tag.getText();
                if (text.includes("RESOLVIDO")) {
                    console.log('Found "RESOLVIDO" tag');
                    resolved = true;
                    break;
                }
            }

            if (resolved) {
                // Clica no item de atendimento resolvido
                item.click();

                await driver.sleep(1000); // ❌ Erro: O uso de `sleep` aqui novamente é ineficiente. 
                                         // O Selenium possui métodos como `wait` que são muito mais eficientes e robustos.
                                         // Usar `sleep` sem uma razão específica (como garantir sincronia em condições específicas)
                                         // é considerado má prática.

                // Clica no ícone de finalizar
                let fina = await driver.findElement(By.css('.icone.no-mobile.i-finalizar.ng-scope'));
                await driver.sleep(1000); // ❌ Mesma razão: o `sleep` é usado de forma desnecessária, 
                                          // causando lentidão. `wait` deveria ser usado.

                await fina.click();

                // Localiza o select e muda o valor
                let selectElement = await driver.wait(
                    until.elementLocated(By.css('select.form-control.select-simples')),
                    1000
                );

                // Define o valor do select com JavaScript
                await driver.executeScript("arguments[0].value = '7656';", selectElement);

                // Dispara o evento `change` manualmente
                await driver.executeScript("arguments[0].dispatchEvent(new Event('change'));", selectElement);

                // Aguarda e clica no botão de finalizar atendimento
                let finalizeButton = await driver.wait(
                    until.elementLocated(By.css('[ng-click="onFinalizarAtendimento()"]')),
                    1000
                );

                await finalizeButton.click();
            }
        }

    } catch (error) {
        console.log("Erro durante o processo:", error);
    } finally {
        // ❌ Erro: O navegador não é fechado no final do processo, o que pode deixar sessões de driver abertas
        // e consumir recursos do sistema desnecessariamente. Isso pode causar instabilidade em execuções repetidas.
        // await driver.quit(); 
    }
}

closeCall();
