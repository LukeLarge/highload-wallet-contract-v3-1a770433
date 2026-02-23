import { toNano } from '@ton/core';
import { HighloadWalletV3 } from '../wrappers/HighloadWalletV3';
import { compile, NetworkProvider } from '@ton/blueprint';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    ui.write('Deploying HighloadWalletV3...\n');

    // Generate a new mnemonic and key pair for the highload wallet
    const mnemonic = await mnemonicNew(24);
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    // Allow user to customise subwallet ID and timeout, using recommended defaults
    const subwalletIdInput = await ui.input(
        `Subwallet ID (recommended: ${0x10ad}, press Enter for default)`
    );
    const parsedSubwalletId = subwalletIdInput.trim() === '' ? 0x10ad : parseInt(subwalletIdInput.trim());
    if (isNaN(parsedSubwalletId)) {
        ui.write('Error: subwallet ID must be a valid number.\n');
        return;
    }
    const subwalletId = parsedSubwalletId;

    const timeoutInput = await ui.input(
        'Timeout in seconds (recommended: 3600 for 1 hour, press Enter for default)'
    );
    const parsedTimeout = timeoutInput.trim() === '' ? 3600 : parseInt(timeoutInput.trim());
    if (isNaN(parsedTimeout) || parsedTimeout <= 0) {
        ui.write('Error: timeout must be a valid number greater than 0.\n');
        return;
    }
    const timeout = parsedTimeout;

    const highloadWalletV3 = provider.open(
        HighloadWalletV3.createFromConfig(
            {
                publicKey: keyPair.publicKey,
                subwalletId,
                timeout,
            },
            await compile('HighloadWalletV3')
        )
    );

    await highloadWalletV3.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(highloadWalletV3.address);

    ui.write('\n✅ HighloadWalletV3 deployed successfully!\n');
    ui.write(`Address:    ${highloadWalletV3.address.toString()}\n`);
    ui.write(`Public key: ${keyPair.publicKey.toString('hex')}\n`);
    ui.write(`Subwallet:  ${subwalletId} (0x${subwalletId.toString(16)})\n`);
    ui.write(`Timeout:    ${timeout} seconds\n`);
    ui.write('\n⚠️  Save your mnemonic phrase securely — it will not be shown again:\n');
    ui.write(mnemonic.join(' ') + '\n');
}
