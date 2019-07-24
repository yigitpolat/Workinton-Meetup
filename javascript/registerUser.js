/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');

const ccpPath = path.resolve(__dirname, 'mychannel_fabcar_profile.json');

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(process.env.username);
        if (userExists) {
            console.log(`An identity for the user "${process.env.username}" already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user.
        const adminExists = await wallet.exists('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: process.env.username, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: process.env.username, enrollmentSecret: secret });
        const userIdentity = X509WalletMixin.createIdentity('org1msp', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(process.env.username, userIdentity);
        console.log(`Successfully registered and enrolled admin user "${process.env.username}" and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user "${process.env.username}": ${error}`);
        process.exit(1);
    }
}

main();
