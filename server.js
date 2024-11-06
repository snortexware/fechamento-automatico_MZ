const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const schedule = require('node-schedule');

// Configure Chrome options
const chromeOptions = new chrome.Options()
.addArguments('--headless=old')
.addArguments('--disable-gpu')
.addArguments('--window-size=1366,768')

    

async function checkAtendimentos() {
    let driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

    try {
      
        await driver.get('https://megazap.chat/login.html');
        console.log("Navigated to login page.");

        
        await driver.findElement(By.id('email')).sendKeys('lucas.gramnet');
        await driver.findElement(By.id('password')).sendKeys('Lucas.moreira2');
        await driver.findElement(By.css('.btn.btn-lg.btn-block.m-t-20.bgm-black.waves-effect.ng-binding')).click();
        console.log("Login attempt made.");

        
        await driver.wait(until.urlContains('https://megazap.chat/index.html#/atendimentos/chat'), 10000);
        console.log("Login successful!");

        
        let closeButton = await driver.wait(
            until.elementLocated(By.css('[ng-click="close()"]')),
            5000
        );
        await closeButton.click();
        console.log("Closed any modal.");

        
        let parentDiv = await driver.findElement(By.id('atendimentos-ativos'));
        let activeItems = await parentDiv.findElements(By.css('div[id^="ativo-"]'));
        console.log(`Found ${activeItems.length} active attendances.`);

        
        for (let item of activeItems) {
            let itemId = await item.getAttribute('id');
            console.log(`Processing item with ID: ${itemId}`);

            
            await driver.executeScript("arguments[0].scrollIntoView(true);", item);
            await driver.sleep(1000);
            await driver.executeScript("arguments[0].click();", item);
            await driver.sleep(1000);
            let atendimentoContent = await item.findElement(By.css('.atendimento-item-content'));
            let tagsContainerExists = await atendimentoContent.findElements(By.css('.tags-container.ng-scope'));

            if (tagsContainerExists.length > 0) {
                console.log(`tags-container found inside item ${itemId}`);

                let tags = await atendimentoContent.findElements(By.css('.item-tag.ng-binding.ng-scope'));
                for (let tag of tags) {
                    let tagText = await tag.getText();
                    tagText = tagText.trim();

                    if (tagText.includes("RESOLVIDO")) {
                        console.log(`Tag "RESOLVIDO" found for item ${itemId}. Finalizing...`);

                        let finalizeIcon = await driver.wait(
                            until.elementLocated(By.css('.icone.no-mobile.i-finalizar.ng-scope')),
                            5000
                        );
                        await driver.executeScript("arguments[0].scrollIntoView(true);", finalizeIcon);
                        await finalizeIcon.click();

                        let selectElement = await driver.wait(
                            until.elementLocated(By.css('select.form-control.select-simples')),
                            5000
                        );
                        await driver.executeScript("arguments[0].value = '7656';", selectElement);
                        await driver.executeScript("arguments[0].dispatchEvent(new Event('change'));", selectElement);

                        let finalizeButton = await driver.wait(
                            until.elementLocated(By.css('[ng-click="onFinalizarAtendimento()"]')),
                            5000
                        );
                        await finalizeButton.click();
                        console.log(`Atendimento ${itemId} finalized.`);
                    } else if (tagText.includes("SEM CONEXÃO")) {
                        console.log(`Tag "SEM CONEXÃO" found for item ${itemId}. Transferring...`);

                        let transferIcon = await driver.wait(
                            until.elementLocated(By.css('.icone.no-mobile.i-transferir.ng-scope')),
                            5000
                        );
                        await transferIcon.click();

                        let selecionaDep = await driver.wait(
                            until.elementLocated(By.css('[ng-change="onSelecionarDepartamento()"]')),
                            5000
                        );
                        await driver.executeScript("arguments[0].value = '34214';", selecionaDep);
                        await driver.executeScript("arguments[0].dispatchEvent(new Event('change'));", selecionaDep);

                        let select1 = await driver.wait(
                            until.elementLocated(By.css('select[ng-model="departamentoSelecionado.atendenteId"]')),
                            5000
                        );
                        await driver.executeScript("arguments[0].value = '0';", select1);
                        await driver.executeScript("arguments[0].dispatchEvent(new Event('change'));", select1);

                        let enviar = await driver.wait(until.elementLocated(By.css('[ng-click="onModalInserir()"]')));
                        await enviar.click();
                        console.log(`Atendimento ${itemId} transferred.`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error during checkAtendimentos process:', error);
    } finally {
        await driver.quit();
    }
}
const agendarTarde = schedule.scheduleJob('00 18 * * *', function() {
    checkAtendimentos();
});
console.log("Agendado para as 18:00");

const agendarNoite = schedule.scheduleJob('45 21 * * *', function() {
    checkAtendimentos();
});
console.log("Agendado para as 21:45");